package com.example.loanservicemysql.service;

import com.example.loanservicemysql.domain.Loan;
import com.example.loanservicemysql.dto.LoanRequest;
import com.example.loanservicemysql.dto.LoanResponse;
import com.example.loanservicemysql.repository.LoanRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class LoanService {

    private final LoanRepository loanRepository;

    public LoanService(LoanRepository loanRepository) {
        this.loanRepository = loanRepository;
    }

    @Transactional
    public LoanResponse create(LoanRequest request) {
        Loan loan = new Loan(request.applicantName(), request.amount(), request.termMonths());
        return LoanResponse.from(loanRepository.save(loan));
    }

    @Transactional(readOnly = true)
    public List<LoanResponse> findAll() {
        return loanRepository.findAll().stream().map(LoanResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public LoanResponse findById(Long id) {
        return loanRepository.findById(id)
                .map(LoanResponse::from)
                .orElseThrow(() -> new LoanNotFoundException(id));
    }
}
