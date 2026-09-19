package com.example.loanservicemysql.dto;

import com.example.loanservicemysql.domain.Loan;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record LoanResponse(
        Long id,
        String applicantName,
        BigDecimal amount,
        Integer termMonths,
        LocalDateTime createdAt) {

    public static LoanResponse from(Loan loan) {
        return new LoanResponse(
                loan.getId(),
                loan.getApplicantName(),
                loan.getAmount(),
                loan.getTermMonths(),
                loan.getCreatedAt());
    }
}
