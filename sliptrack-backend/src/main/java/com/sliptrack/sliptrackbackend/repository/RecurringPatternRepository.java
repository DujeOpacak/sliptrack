package com.sliptrack.sliptrackbackend.repository;

import com.sliptrack.sliptrackbackend.model.RecurringPattern;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface RecurringPatternRepository extends JpaRepository<RecurringPattern, Long> {

    // Lista, ne Optional — isti (userId, providerName) sad može imati više redaka,
    // jedan po (subCategory, property) kombinaciji. RecurringPatternService filtrira
    // null-safe u Javi umjesto riskantne JPQL nullable usporedbe (isti razlog kao
    // PaymentSlipRepository.findUserProviderPairsWithMinimumHistory).
    List<RecurringPattern> findByUserIdAndProviderName(Long userId, String providerName);

    @EntityGraph(attributePaths = {"user", "subCategory", "property"})
    List<RecurringPattern> findByNextPredictedDateBetween(LocalDate from, LocalDate to);
}
