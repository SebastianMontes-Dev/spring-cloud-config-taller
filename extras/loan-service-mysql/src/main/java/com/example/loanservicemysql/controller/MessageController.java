package com.example.loanservicemysql.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/** Igual que en el taller: comprueba que application.message llega desde el Config Server. */
@RestController
public class MessageController {

    @Value("${application.message}")
    private String message;

    @GetMapping("/message")
    public String getMessage() {
        return message;
    }
}
