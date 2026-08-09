package com.sliptrack.sliptrackbackend.service;

import com.sliptrack.sliptrackbackend.model.PaymentSlip;
import com.sliptrack.sliptrackbackend.model.RecurringPattern;
import com.sliptrack.sliptrackbackend.model.User;
import com.sliptrack.sliptrackbackend.repository.PaymentSlipRepository;
import com.sliptrack.sliptrackbackend.repository.RecurringPatternRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RecurringPatternService {

    private static final int MIN_HISTORY_SIZE = 3;

    private final PaymentSlipRepository paymentSlipRepository;
    private final RecurringPatternRepository recurringPatternRepository;

    public void recomputeAll() {
        for (Object[] pair : paymentSlipRepository.findUserProviderPairsWithMinimumHistory()) {
            Long userId = (Long) pair[0];
            String providerName = (String) pair[1];
            recomputeOne(userId, providerName);
        }
    }

    private void recomputeOne(Long userId, String providerName) {
        List<PaymentSlip> history = paymentSlipRepository.findByUserIdAndProviderNameOrderByDueDateAsc(userId, providerName);
        if (history.size() < MIN_HISTORY_SIZE) {
            return;
        }

        User user = history.get(0).getUser();

        int averageDayOfMonth = (int) Math.round(
                history.stream().mapToInt(slip -> slip.getDueDate().getDayOfMonth()).average().orElseThrow());

        BigDecimal averageAmount = history.stream()
                .map(PaymentSlip::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(BigDecimal.valueOf(history.size()), 2, RoundingMode.HALF_UP);

        LocalDate lastPaymentDate = history.get(history.size() - 1).getDueDate();

        long cadenceMonths = averageCadenceMonths(history);
        LocalDate nextPredictedDate = projectNextPredictedDate(lastPaymentDate, cadenceMonths, averageDayOfMonth);

        RecurringPattern pattern = recurringPatternRepository.findByUserIdAndProviderName(userId, providerName)
                .orElseGet(() -> RecurringPattern.builder().user(user).providerName(providerName).build());

        pattern.setAverageDayOfMonth(averageDayOfMonth);
        pattern.setAverageAmount(averageAmount);
        pattern.setLastPaymentDate(lastPaymentDate);
        pattern.setNextPredictedDate(nextPredictedDate);

        recurringPatternRepository.save(pattern);
    }

    // Average gap between consecutive slips, rounded to whole months (min. 1) — lets
    // quarterly/semi-annual/annual providers get a correct cadence instead of an
    // assumed monthly one.
    private long averageCadenceMonths(List<PaymentSlip> history) {
        long totalMonths = 0;
        for (int i = 1; i < history.size(); i++) {
            YearMonth previous = YearMonth.from(history.get(i - 1).getDueDate());
            YearMonth current = YearMonth.from(history.get(i).getDueDate());
            totalMonths += Math.max(ChronoUnit.MONTHS.between(previous, current), 1);
        }
        long averageMonths = Math.round((double) totalMonths / (history.size() - 1));
        return Math.max(averageMonths, 1);
    }

    // Keeps advancing by one cadence at a time until the prediction is today or later,
    // so a missed cycle (no new slip logged) doesn't leave nextPredictedDate stuck in
    // the past forever — each daily recompute self-corrects it back into the future.
    private LocalDate projectNextPredictedDate(LocalDate lastPaymentDate, long cadenceMonths, int averageDayOfMonth) {
        LocalDate today = LocalDate.now();
        LocalDate predicted = lastPaymentDate;
        do {
            YearMonth nextMonth = YearMonth.from(predicted).plusMonths(cadenceMonths);
            int clampedDay = Math.min(averageDayOfMonth, nextMonth.lengthOfMonth());
            predicted = nextMonth.atDay(clampedDay);
        } while (predicted.isBefore(today));
        return predicted;
    }
}
