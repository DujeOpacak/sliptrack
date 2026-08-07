package com.sliptrack.sliptrackbackend.service;

import com.sliptrack.sliptrackbackend.dto.CategoryAmountResponse;
import com.sliptrack.sliptrackbackend.dto.DashboardSummaryResponse;
import com.sliptrack.sliptrackbackend.dto.PropertySubCategoryAmountResponse;
import com.sliptrack.sliptrackbackend.dto.ProviderAmountResponse;
import com.sliptrack.sliptrackbackend.dto.SubCategoryAmountResponse;
import com.sliptrack.sliptrackbackend.dto.TimelinePointResponse;
import com.sliptrack.sliptrackbackend.enums.PaymentStatus;
import com.sliptrack.sliptrackbackend.model.PaymentSlip;
import com.sliptrack.sliptrackbackend.model.SubCategory;
import com.sliptrack.sliptrackbackend.model.User;
import com.sliptrack.sliptrackbackend.repository.PaymentSlipRepository;
import com.sliptrack.sliptrackbackend.security.CurrentUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
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

    public List<SubCategoryAmountResponse> getBySubCategory(Long categoryId, Long propertyId,
                                                              LocalDate dueDateFrom, LocalDate dueDateTo) {
        User currentUser = currentUserService.getCurrentUser();

        Specification<PaymentSlip> spec = (root, query, cb) -> cb.equal(root.get("user").get("id"), currentUser.getId());
        spec = spec.and((root, query, cb) -> cb.isNotNull(root.get("subCategory")));

        if (categoryId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("category").get("id"), categoryId));
        }
        if (propertyId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("property").get("id"), propertyId));
        }
        if (dueDateFrom != null) {
            spec = spec.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("dueDate"), dueDateFrom));
        }
        if (dueDateTo != null) {
            spec = spec.and((root, query, cb) -> cb.lessThanOrEqualTo(root.get("dueDate"), dueDateTo));
        }

        List<PaymentSlip> slips = paymentSlipRepository.findAll(spec);

        Map<Long, SubCategory> subCategoriesById = new LinkedHashMap<>();
        Map<Long, BigDecimal> totalsById = new LinkedHashMap<>();
        Map<Long, Long> countsById = new LinkedHashMap<>();

        for (PaymentSlip slip : slips) {
            SubCategory subCategory = slip.getSubCategory();
            subCategoriesById.putIfAbsent(subCategory.getId(), subCategory);
            totalsById.merge(subCategory.getId(), slip.getAmount(), BigDecimal::add);
            countsById.merge(subCategory.getId(), 1L, Long::sum);
        }

        return subCategoriesById.values().stream()
                .sorted(Comparator.comparing(SubCategory::getName))
                .map(subCategory -> new SubCategoryAmountResponse(
                        subCategory.getId(), subCategory.getName(),
                        subCategory.getCategory().getId(), subCategory.getCategory().getName(),
                        totalsById.get(subCategory.getId()), countsById.get(subCategory.getId())))
                .toList();
    }

    public List<PropertySubCategoryAmountResponse> getPropertyComparison(LocalDate dueDateFrom, LocalDate dueDateTo) {
        User currentUser = currentUserService.getCurrentUser();

        Specification<PaymentSlip> spec = (root, query, cb) -> cb.equal(root.get("user").get("id"), currentUser.getId());
        spec = spec.and((root, query, cb) -> cb.isNotNull(root.get("property")));

        if (dueDateFrom != null) {
            spec = spec.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("dueDate"), dueDateFrom));
        }
        if (dueDateTo != null) {
            spec = spec.and((root, query, cb) -> cb.lessThanOrEqualTo(root.get("dueDate"), dueDateTo));
        }

        List<PaymentSlip> slips = paymentSlipRepository.findAll(spec);

        record Key(Long propertyId, Long subCategoryId) {
        }

        Map<Key, PaymentSlip> representativeByKey = new LinkedHashMap<>();
        Map<Key, BigDecimal> totalsByKey = new LinkedHashMap<>();
        Map<Key, Long> countsByKey = new LinkedHashMap<>();

        for (PaymentSlip slip : slips) {
            Key key = new Key(slip.getProperty().getId(), slip.getSubCategory().getId());
            representativeByKey.putIfAbsent(key, slip);
            totalsByKey.merge(key, slip.getAmount(), BigDecimal::add);
            countsByKey.merge(key, 1L, Long::sum);
        }

        return representativeByKey.entrySet().stream()
                .sorted(Comparator
                        .comparing((Map.Entry<Key, PaymentSlip> e) -> e.getValue().getProperty().getName())
                        .thenComparing(e -> e.getValue().getSubCategory().getName()))
                .map(entry -> {
                    PaymentSlip slip = entry.getValue();
                    Key key = entry.getKey();
                    return new PropertySubCategoryAmountResponse(
                            slip.getProperty().getId(), slip.getProperty().getName(),
                            slip.getSubCategory().getId(), slip.getSubCategory().getName(),
                            totalsByKey.get(key), countsByKey.get(key));
                })
                .toList();
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
