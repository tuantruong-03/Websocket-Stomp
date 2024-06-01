import React, { useState } from 'react'
import { over } from 'stompjs'
import SockJS from 'sockjs-client'

var stompClient = null;

const ChatRoom = () => {
    const [tab, setTab] = useState("CHATROOM")
    const [publicChats, setPublicChats] = useState([]);
    const [privateChats, setPrivateChats] = useState(new Map())
    const [userData, setUserData] = useState({
        username: "",
        receiverName: "",
        connected: false,
        message: ""
    })
    const handleUsername = (event) => {
        const { value } = event.target;
        setUserData({ ...userData, "username": value })
    }

    const registerUser = () => {
        // In server, registry.addEndpoint("/ws").setAllowedOriginPatterns("*").withSockJS();
        let Sock = new SockJS('http://localhost:8080/ws')
        stompClient = over(Sock)
        stompClient.connect({}, onConnected, onError)
    }

    const onConnected = () => {
        setUserData({ ...userData, "connected": true })
        // Listen to the chatroom public
        stompClient.subscribe('/chatroom/public', onPublicMessageReceived)
        // Listen to itself
        stompClient.subscribe('/user/' + userData.username + "/private", onPrivateMessageReceived)
        //  subscribe(destination: string
        // , callback?: ((message: Message) => any) | undefined, headers?: {} | undefined): Subscription
    }
    const onError = (err) => {
        console.log(err)
    }

    const onPublicMessageReceived = (payload) => {
        let payloadData = JSON.parse(payload.body)
        switch (payloadData.status) {
            case "JOIN":
                if (!privateChats.has(payloadData.senderName)) {
                    privateChats.set(payloadData.senderName, []);
                    setPrivateChats(new Map(privateChats))
                }
                break;
            case "MESSAGE":
                publicChats.push(payloadData);
                setPublicChats([...publicChats])
                break
        }
    }

    const onPrivateMessageReceived = (payload) => {
        let payloadData = JSON.parse(payload);
        if (privateChats.has(payloadData.senderName)) {
            privateChats.get(payloadData.senderName).push(payload);
            setPrivateChats(new Map(privateChats))
        } else {
            let list = [];
            list.push(payloadData)
            privateChats.set(payloadData.senderName, list);
            setPrivateChats(new Map(privateChats))
        }
    }

    return (
        <div className="container">
            {userData.connected ?
                <div className='chat-box'>
                    <div className='member-list'>
                        <ul>
                            <li onClick={() => setTab("CHATROOM")} className={`member ${tab === "CHATROOM" && "active"}`}>Chatroom</li>
                            {[...privateChats.keys()].map((name, index) => {
                                <li onClick={() => setTab(name)} className={`member ${tab === name && "active"}`} key={index}>
                                    {name}
                                </li>
                            })}
                        </ul>
                    </div>
                    {/* Public chatroom */}
                    {tab === "CHATROOM" && <div className='chat-content'>
                        <ul className='chat-messages'>
                            {publicChats.map((chat, index) => {
                                <li className='message' key={index}>
                                    {chat.senderName !== userData.username && <div className='avatar'>{chat.senderName}</div>}
                                    <div className='message-data'>{chat.message}</div>
                                    {chat.senderName === userData.username && <div className='avatar'>{chat.senderName}</div>}
                                </li>
                            })}
                        </ul>
                  

                    </div>}
                    {/* Indiviual chatroom */}
                    {tab === "CHATROOM" && <div className='chat-content'>
                        <ul>
                            {[...privateChats.get(tab)].map((chat, index) => {
                                <li className='message' key={index}>
                                    {chat.senderName !== userData.username && <div className='avatar'>{chat.senderName}</div>}
                                    <div className='message-data'>{chat.message}</div>
                                    {chat.senderName === userData.username && <div className='avatar'>{chat.senderName}</div>}
                                </li>
                            })}
                        </ul>
                
                    </div>}

                </div>
                :
                <div className='register'>
                    <input id='user-name'
                        placeholder='Enter the username'
                        value={userData.username}
                        onChange={handleUsername} />
                    <button type='button' onClick={registerUser}>
                        Connect
                    </button>
                </div>

            }
        </div>
    )
}
export default ChatRoom