CREATE TABLE IF NOT EXISTS loans (
    id             BIGINT         NOT NULL AUTO_INCREMENT,
    applicant_name VARCHAR(120)   NOT NULL,
    amount         DECIMAL(15, 2) NOT NULL,
    term_months    INT            NOT NULL,
    created_at     DATETIME(6)    NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT chk_loans_amount CHECK (amount > 0),
    CONSTRAINT chk_loans_term CHECK (term_months BETWEEN 1 AND 360)
);
