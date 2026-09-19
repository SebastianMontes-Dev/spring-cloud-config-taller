package com.example.loanservice;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {
        "application.message=test",
        "spring.cloud.config.enabled=false"
})
class LoanServiceApplicationTests {

    @Test
    void contextLoads() {
    }

}
