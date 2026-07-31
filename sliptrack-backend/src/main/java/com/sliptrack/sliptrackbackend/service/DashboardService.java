package com.sliptrack.sliptrackbackend.service;

import com.sliptrack.sliptrackbackend.dto.CategoryAmountResponse;
import com.sliptrack.sliptrackbackend.dto.DashboardSummaryResponse;
import com.sliptrack.sliptrackbackend.dto.ProviderAmountResponse;
import com.sliptrack.sliptrackbackend.dto.TimelinePointResponse;
import com.sliptrack.sliptrackbackend.enums.PaymentStatus;
import com.sliptrack.sliptrackbackend.model.PaymentSlip;
import com.sliptrack.sliptrackbackend.model.User;
import com.sliptrack.sliptrackbackend.repository.PaymentSlipRepository;
import com.sliptrack.sliptrackbackend.security.CurrentUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final PaymentSlipRepository paymentSlipRepository;
    private final CurrentUserService currentUserService;

    public DashboardSummaryResponse getSummary(Long categoryId, String providerName) {
        User currentUser = currentUserService.getCurrentUser();

        Specification<PaymentSlip> spec = (root, query, cb) -> cb.equal(root.get("user").get("id"), currentUser.getId());

        if (categoryId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("category").get("id"), categoryId));
        }
        if (providerName != null && !providerName.isBlank()) {
            spec = spec.and((root, query, cb) -> cb.like(cb.lower(root.get("providerName")), "%" + providerName.toLowerCase() + "%"));
        }

        List<PaymentSlip> slips = paymentSlipRepository.findAll(spec);

        BigDecimal totalPaid = BigDecimal.ZERO;
        BigDecimal totalUnpaid = BigDecimal.ZERO;
        long paidCount = 0;
        long unpaidCount = 0;

        for (PaymentSlip slip : slips) {
            if (slip.getStatus() == PaymentStatus.PAID) {
                totalPaid = totalPaid.add(slip.getAmount());
                paidCount++;
            } else {
                totalUnpaid = totalUnpaid.add(slip.getAmount());
                unpaidCount++;
            }
        }

        return DashboardSummaryResponse.builder()
                .totalPaid(totalPaid)
                .totalUnpaid(totalUnpaid)
                .paidCount(paidCount)
                .unpaidCount(unpaidCount)
                .build();
    }

    public List<CategoryAmountResponse> getByCategory() {
        User currentUser = currentUserService.getCurrentUser();
        return paymentSlipRepository.sumAmountGroupedByCategory(currentUser.getId());
    }

    public List<ProviderAmountResponse> getByProvider() {
        User currentUser = currentUserService.getCurrentUser();
        return paymentSlipRepository.sumAmountGroupedByProvider(currentUser.getId());
    }

    public List<TimelinePointResponse> getTimeline(Integer months) {
        User currentUser = currentUserService.getCurrentUser();
        int rangeMonths = (months == null || months < 1) ? 6 : months;

        Map<String, BigDecimal> totalsByPeriod = paymentSlipRepository.sumAmountGroupedByMonth(currentUser.getId()).stream()
                .collect(Collectors.toMap(row -> (String) row[0], row -> (BigDecimal) row[1]));

        YearMonth end = YearMonth.now();
        YearMonth start = end.minusMonths(rangeMonths - 1L);

        List<TimelinePointResponse> result = new ArrayList<>();
        for (YearMonth ym = start; !ym.isAfter(end); ym = ym.plusMonths(1)) {
            String period = ym.toString();
            result.add(new TimelinePointResponse(period, totalsByPeriod.getOrDefault(period, BigDecimal.ZERO)));
        }
        return result;
    }
}
