import React, { useState } from 'react';
import { over } from 'stompjs';
import SockJS from 'sockjs-client';

var stompClient = null;

const ChatRoom = () => {
    const [tab, setTab] = useState("CHATROOM");
    const [publicChats, setPublicChats] = useState([]);
    const [privateChats, setPrivateChats] = useState(new Map());
    const [userData, setUserData] = useState({
        username: "",
        receiverName: "",
        connected: false,
        message: ""
    });

    const handleValue = (event) => {
        const { value, name } = event.target;
        setUserData({ ...userData, [name]: value });
    };

    const sendPublicMessage = () => {
        if (stompClient) {
            let chatMessage = {
                senderName: userData.username,
                message: userData.message,
                status: 'MESSAGE'
            };
            stompClient.send('/app/message', {}, JSON.stringify(chatMessage));
            setUserData({ ...userData, message: "" });
        }
    };

    const sendPrivateMessage = () => {
        if (stompClient) {
            let chatMessage = {
                senderName: userData.username,
                receiverName: tab,
                message: userData.message,
                status: 'MESSAGE'
            };
            if (userData.username !== tab) {
                let chatMessages = privateChats.get(tab) || [];
                chatMessages.push(chatMessage);
                privateChats.set(tab, chatMessages);
                setPrivateChats(new Map(privateChats));
            }
            stompClient.send('/app/private-message', {}, JSON.stringify(chatMessage));
            setUserData({ ...userData, message: "" });
        }
    };

    const registerUser = () => {
        let Sock = new SockJS('http://localhost:8080/ws');
        stompClient = over(Sock);
        stompClient.connect({}, onConnected, onError);
    };

    const onConnected = () => {
        setUserData({ ...userData, connected: true });
        stompClient.subscribe('/chatroom/public', onPublicMessageReceived);
        stompClient.subscribe('/user/' + userData.username + '/private', onPrivateMessageReceived);
        userJoin();
    };

    const userJoin = () => {
        let chatMessage = {
            senderName: userData.username,
            status: 'JOIN'
        };
        stompClient.send('/app/message', {}, JSON.stringify(chatMessage));
    };

    const onError = (err) => {
        console.log(err);
    };

    const onPublicMessageReceived = (payload) => {
        let payloadData = JSON.parse(payload.body);
        console.log("payload in onPublicMessageReceived", payload)
        switch (payloadData.status) {
            case "JOIN":
                if (!privateChats.has(payloadData.senderName)) {
                    privateChats.set(payloadData.senderName, []);
                    setPrivateChats(new Map(privateChats));
                }
                break;
            case "MESSAGE":
                setPublicChats((prevPublicChats) => [...prevPublicChats, payloadData]);
                break;
        }
    };

    const onPrivateMessageReceived = (payload) => {
        let payloadData = JSON.parse(payload.body);
        let chatMessages = privateChats.get(payloadData.senderName) || [];
        chatMessages.push(payloadData);
        privateChats.set(payloadData.senderName, chatMessages);
        setPrivateChats(new Map(privateChats));
    };

    return (
        <div className="container">
            {userData.connected ? (
                <div className='chat-box'>
                    <div className='member-list'>
                        <ul>
                            <li onClick={() => setTab("CHATROOM")} className={`member ${tab === "CHATROOM" && "active"}`}>Chatroom</li>
                            {[...privateChats.keys()].map((name, index) => (
                                <li onClick={() => setTab(name)} className={`member ${tab === name && "active"}`} key={index}>
                                    {name}
                                </li>
                            ))}
                        </ul>
                    </div>
                    {/* Public chatroom */}
                    {tab === "CHATROOM" && (
                        <div className='chat-content'>
                            <ul className='chat-messages'>
                                {publicChats.map((chat, index) => (
                                    <li className='message' key={index}>
                                        {chat.senderName !== userData.username && <div className='avatar'>{chat.senderName}</div>}
                                        <div className='message-data'>{chat.message}</div>
                                        {chat.senderName === userData.username && <div className='avatar self'>{chat.senderName}</div>}
                                    </li>
                                ))}
                            </ul>
                            <div className='send-message'>
                                <input name='message' type='text' className='input-message' placeholder='Enter public message' value={userData.message} onChange={handleValue} />
                                <button type='button' className='send-button' onClick={sendPublicMessage}>send</button>
                            </div>
                        </div>
                    )}
                    {/* Individual chatroom */}
                    {tab !== "CHATROOM" && (
                        <div className='chat-content'>
                            <ul className='chat-messages'>
                                {(privateChats.get(tab) || []).map((chat, index) => (
                                    <li className='message' key={index}>
                                        {chat.senderName !== userData.username && <div className='avatar'>{chat.senderName}</div>}
                                        <div className='message-data'>{chat.message}</div>
                                        {chat.senderName === userData.username && <div className='avatar self'>{chat.senderName}</div>}
                                    </li>
                                ))}
                            </ul>
                            <div className='send-message'>
                                <input type='text' name='message' className='input-message' placeholder={`Enter private message for ${tab}`} value={userData.message} onChange={handleValue} />
                                <button type='button' className='send-button' onClick={sendPrivateMessage}>send</button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className='register'>
                    <input id='user-name' placeholder='Enter the username' value={userData.username} name='username' onChange={handleValue} />
                    <button type='button' onClick={registerUser}>Connect</button>
                </div>
            )}
        </div>
    );
};

export default ChatRoom;
