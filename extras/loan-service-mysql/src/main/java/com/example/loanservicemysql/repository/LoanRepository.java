package com.example.loanservicemysql.repository;

import com.example.loanservicemysql.domain.Loan;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LoanRepository extends JpaRepository<Loan, Long> {
}
