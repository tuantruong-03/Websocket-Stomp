package com.backend.websocket.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import com.backend.websocket.model.Message;

@Controller
public class ChatController {
    @Autowired
    private SimpMessagingTemplate simpMessagingTemplate;
    // Client will send "stomp" to "/app/message"
    @MessageMapping("/message") 
    // Server will handle message in "/app/message" then broadcast to "/chatroom/public"
    // Note: all clients must subscribe to "/chatroom/public" to get the broadcast message from server
    @SendTo("/chatroom/public")
    private Message receivePublicMessage(@Payload Message message){
        System.out.println("/chatroom/public " + message.toString());
        return message;
    }

    // Client will send "stomp" to "/app/private-message"
    @MessageMapping("private-message") 
    public Message receivePrivateMessage(@Payload Message message) {
        System.out.println("/private-message " + message.toString());
        // Server will handle message then sendback to "/user/{receiverName}/private"
        simpMessagingTemplate.convertAndSendToUser(message.getReceiverName(), "/private",message);
        return message;
    }

    // In client side, client MUST subscribe to two topics "/user/{theirOwnName}/private" and "/chatroom/public"
}
