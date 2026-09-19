package com.example.loanservicemysql.service;

public class LoanNotFoundException extends RuntimeException {

    public LoanNotFoundException(Long id) {
        super("Loan " + id + " not found");
    }
}
