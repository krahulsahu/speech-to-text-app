package com.speechapp.controller;

import com.speechapp.model.Transcription;
import com.speechapp.service.TranscriptionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
public class WebSocketController {

    @Autowired
    private TranscriptionService service;

    @MessageMapping("/transcribe")
    @SendTo("/topic/transcription")
    public Transcription handleTranscription(Transcription transcription) {
        if (transcription.getText() != null && !transcription.getText().isBlank()) {
            return service.save(transcription);
        }
        return transcription;
    }
}
