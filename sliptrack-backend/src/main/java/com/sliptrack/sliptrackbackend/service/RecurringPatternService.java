package com.sliptrack.sliptrackbackend.service;

import com.sliptrack.sliptrackbackend.model.PaymentSlip;
import com.sliptrack.sliptrackbackend.model.Property;
import com.sliptrack.sliptrackbackend.model.RecurringPattern;
import com.sliptrack.sliptrackbackend.model.SubCategory;
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
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class RecurringPatternService {

    private static final int MIN_HISTORY_SIZE = 3;

    private final PaymentSlipRepository paymentSlipRepository;
    private final RecurringPatternRepository recurringPatternRepository;

    public void recomputeAll() {
        for (Object[] row : paymentSlipRepository.findUserProviderPairsWithMinimumHistory()) {
            Long userId = (Long) row[0];
            String providerName = (String) row[1];
            Long subCategoryId = (Long) row[2];
            Long propertyId = (Long) row[3];
            recomputeOne(userId, providerName, subCategoryId, propertyId);
        }
    }

    private void recomputeOne(Long userId, String providerName, Long subCategoryId, Long propertyId) {
        List<PaymentSlip> history = paymentSlipRepository
                .findByUserIdAndProviderNameOrderByDueDateAsc(userId, providerName).stream()
                .filter(slip -> Objects.equals(idOf(slip.getSubCategory()), subCategoryId)
                        && Objects.equals(idOf(slip.getProperty()), propertyId))
                .toList();
        if (history.size() < MIN_HISTORY_SIZE) {
            return;
        }

        User user = history.get(0).getUser();
        SubCategory subCategory = history.get(0).getSubCategory();
        Property property = history.get(0).getProperty();

        int averageDayOfMonth = (int) Math.round(
                history.stream().mapToInt(slip -> slip.getDueDate().getDayOfMonth()).average().orElseThrow());

        BigDecimal averageAmount = history.stream()
                .map(PaymentSlip::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(BigDecimal.valueOf(history.size()), 2, RoundingMode.HALF_UP);

        LocalDate lastPaymentDate = history.get(history.size() - 1).getDueDate();

        long cadenceMonths = averageCadenceMonths(history);
        LocalDate nextPredictedDate =
                projectNextPredictedDate(lastPaymentDate, cadenceMonths, averageDayOfMonth, LocalDate.now());

        RecurringPattern pattern = recurringPatternRepository.findByUserIdAndProviderName(userId, providerName)
                .stream()
                .filter(p -> Objects.equals(idOf(p.getSubCategory()), subCategoryId)
                        && Objects.equals(idOf(p.getProperty()), propertyId))
                .findFirst()
                .orElseGet(() -> RecurringPattern.builder()
                        .user(user)
                        .providerName(providerName)
                        .subCategory(subCategory)
                        .property(property)
                        .build());

        pattern.setAverageDayOfMonth(averageDayOfMonth);
        pattern.setAverageAmount(averageAmount);
        pattern.setLastPaymentDate(lastPaymentDate);
        pattern.setNextPredictedDate(nextPredictedDate);

        recurringPatternRepository.save(pattern);
    }

    private static Long idOf(SubCategory subCategory) {
        return subCategory == null ? null : subCategory.getId();
    }

    private static Long idOf(Property property) {
        return property == null ? null : property.getId();
    }

    // prosjecni razmak izmedu uzastopnih uplata, omogucuje pruzateljima usluga s tromjesecnim, polugodisnjim,
    // godisnjim ciklusom ispravan ritam umjesto pretpostavljenog mjesecnog.
    // metoda nije privatna kako bi test mogao koristiti izravno bez mockanja repozitorija
    long averageCadenceMonths(List<PaymentSlip> history) {
        long totalMonths = 0;
        for (int i = 1; i < history.size(); i++) {
            YearMonth previous = YearMonth.from(history.get(i - 1).getDueDate());
            YearMonth current = YearMonth.from(history.get(i).getDueDate());
            totalMonths += Math.max(ChronoUnit.MONTHS.between(previous, current), 1);
        }
        long averageMonths = Math.round((double) totalMonths / (history.size() - 1));
        return Math.max(averageMonths, 1);
    }

    // nastavlja za jedan ciklus sve dok predvideni datum ne bude danas ili kasnije
    // kako propusteni ciklus ne bi trajno zadrzao predictedDate u proslosti
    LocalDate projectNextPredictedDate(LocalDate lastPaymentDate, long cadenceMonths, int averageDayOfMonth, LocalDate today) {
        LocalDate predicted = lastPaymentDate;
        do {
            YearMonth nextMonth = YearMonth.from(predicted).plusMonths(cadenceMonths);
            int clampedDay = Math.min(averageDayOfMonth, nextMonth.lengthOfMonth());
            predicted = nextMonth.atDay(clampedDay);
        } while (predicted.isBefore(today));
        return predicted;
    }
}
