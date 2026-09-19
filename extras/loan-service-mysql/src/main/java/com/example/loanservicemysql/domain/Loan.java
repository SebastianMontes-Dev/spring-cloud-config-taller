package com.example.loanservicemysql.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Entity
@Table(name = "loans")
public class Loan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "applicant_name", nullable = false, length = 120)
    private String applicantName;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(name = "term_months", nullable = false)
    private Integer termMonths;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    protected Loan() {
        // requerido por JPA
    }

    public Loan(String applicantName, BigDecimal amount, Integer termMonths) {
        this.applicantName = applicantName;
        this.amount = amount.setScale(2, RoundingMode.UNNECESSARY);
        this.termMonths = termMonths;
        // DATETIME(6) guarda microsegundos: se trunca aquí para que lo devuelto coincida con lo persistido
        this.createdAt = LocalDateTime.now().truncatedTo(ChronoUnit.MICROS);
    }

    public Long getId() {
        return id;
    }

    public String getApplicantName() {
        return applicantName;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public Integer getTermMonths() {
        return termMonths;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
