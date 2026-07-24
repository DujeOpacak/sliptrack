package com.sliptrack.sliptrackbackend.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "recurring_patterns")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecurringPattern {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String providerName;

    private Integer averageDayOfMonth;

    private BigDecimal averageAmount;

    private LocalDate lastPaymentDate;

    private LocalDate nextPredictedDate;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
