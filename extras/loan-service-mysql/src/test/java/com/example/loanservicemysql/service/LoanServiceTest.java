package com.example.loanservicemysql.service;

import com.example.loanservicemysql.domain.Loan;
import com.example.loanservicemysql.dto.LoanRequest;
import com.example.loanservicemysql.dto.LoanResponse;
import com.example.loanservicemysql.repository.LoanRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LoanServiceTest {

    @Mock
    private LoanRepository loanRepository;

    @InjectMocks
    private LoanService loanService;

    @Test
    void createSavesLoanAndReturnsResponse() {
        LoanRequest request = new LoanRequest("Ana Torres", new BigDecimal("15000.50"), 24);
        when(loanRepository.save(any(Loan.class))).thenAnswer(inv -> inv.getArgument(0));

        LoanResponse response = loanService.create(request);

        assertThat(response.applicantName()).isEqualTo("Ana Torres");
        assertThat(response.amount()).isEqualByComparingTo("15000.50");
        assertThat(response.termMonths()).isEqualTo(24);
        assertThat(response.createdAt()).isNotNull();
        verify(loanRepository).save(any(Loan.class));
    }

    @Test
    void findAllMapsEntitiesToResponses() {
        when(loanRepository.findAll()).thenReturn(List.of(
                new Loan("Ana Torres", new BigDecimal("1000.00"), 12),
                new Loan("Luis Rojas", new BigDecimal("2500.00"), 36)));

        List<LoanResponse> result = loanService.findAll();

        assertThat(result).extracting(LoanResponse::applicantName)
                .containsExactly("Ana Torres", "Luis Rojas");
    }

    @Test
    void findByIdReturnsLoanWhenPresent() {
        when(loanRepository.findById(7L))
                .thenReturn(Optional.of(new Loan("Ana Torres", new BigDecimal("1000.00"), 12)));

        assertThat(loanService.findById(7L).applicantName()).isEqualTo("Ana Torres");
    }

    @Test
    void findByIdThrowsWhenMissing() {
        when(loanRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> loanService.findById(99L))
                .isInstanceOf(LoanNotFoundException.class)
                .hasMessageContaining("99");
    }
}
