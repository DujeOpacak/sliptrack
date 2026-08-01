package com.sliptrack.sliptrackbackend.repository;

import com.sliptrack.sliptrackbackend.model.RecurringPattern;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface RecurringPatternRepository extends JpaRepository<RecurringPattern, Long> {

    Optional<RecurringPattern> findByUserIdAndProviderName(Long userId, String providerName);

    List<RecurringPattern> findByNextPredictedDateBetween(LocalDate from, LocalDate to);
}
