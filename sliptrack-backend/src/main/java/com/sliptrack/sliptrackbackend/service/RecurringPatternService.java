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

        YearMonth nextMonth = YearMonth.from(lastPaymentDate).plusMonths(1);
        int clampedDay = Math.min(averageDayOfMonth, nextMonth.lengthOfMonth());
        LocalDate nextPredictedDate = nextMonth.atDay(clampedDay);

        RecurringPattern pattern = recurringPatternRepository.findByUserIdAndProviderName(userId, providerName)
                .orElseGet(() -> RecurringPattern.builder().user(user).providerName(providerName).build());

        pattern.setAverageDayOfMonth(averageDayOfMonth);
        pattern.setAverageAmount(averageAmount);
        pattern.setLastPaymentDate(lastPaymentDate);
        pattern.setNextPredictedDate(nextPredictedDate);

        recurringPatternRepository.save(pattern);
    }
}
