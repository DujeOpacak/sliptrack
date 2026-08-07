package com.sliptrack.sliptrackbackend.repository;

import com.sliptrack.sliptrackbackend.dto.AdminCategoryCountResponse;
import com.sliptrack.sliptrackbackend.dto.AdminSubCategoryCountResponse;
import com.sliptrack.sliptrackbackend.dto.CategoryAmountResponse;
import com.sliptrack.sliptrackbackend.dto.ProviderAmountResponse;
import com.sliptrack.sliptrackbackend.enums.PaymentStatus;
import com.sliptrack.sliptrackbackend.model.PaymentSlip;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface PaymentSlipRepository extends JpaRepository<PaymentSlip, Long>, JpaSpecificationExecutor<PaymentSlip> {

    @Override
    @EntityGraph(attributePaths = {"category", "subCategory", "subCategory.category", "property"})
    List<PaymentSlip> findAll(Specification<PaymentSlip> spec);

    @EntityGraph(attributePaths = {"category", "subCategory", "property"})
    Optional<PaymentSlip> findByIdAndUserId(Long id, Long userId);

    boolean existsByCategoryId(Long categoryId);

    boolean existsBySubCategoryId(Long subCategoryId);

    boolean existsByPropertyId(Long propertyId);

    boolean existsBySubCategoryIdAndPropertyIsNotNull(Long subCategoryId);

    List<PaymentSlip> findByStatusAndDueDateBetween(PaymentStatus status, LocalDate from, LocalDate to);

    List<PaymentSlip> findByStatusAndDueDate(PaymentStatus status, LocalDate dueDate);

    List<PaymentSlip> findByStatusAndDueDateBefore(PaymentStatus status, LocalDate dueDate);

    List<PaymentSlip> findByUserIdAndProviderNameOrderByDueDateAsc(Long userId, String providerName);

    boolean existsByUserIdAndProviderNameAndDueDateBetween(
            Long userId, String providerName, LocalDate from, LocalDate to);

    @Query("""
            SELECT p.user.id, p.providerName
            FROM PaymentSlip p
            WHERE p.providerName IS NOT NULL AND p.providerName <> ''
            GROUP BY p.user.id, p.providerName
            HAVING COUNT(p) >= 3
            """)
    List<Object[]> findUserProviderPairsWithMinimumHistory();

    @Query("""
            SELECT new com.sliptrack.sliptrackbackend.dto.CategoryAmountResponse(
                p.category.id, p.category.name, COALESCE(SUM(p.amount), 0), COUNT(p))
            FROM PaymentSlip p
            WHERE p.user.id = :userId
            GROUP BY p.category.id, p.category.name
            ORDER BY p.category.name
            """)
    List<CategoryAmountResponse> sumAmountGroupedByCategory(@Param("userId") Long userId);

    @Query("""
            SELECT new com.sliptrack.sliptrackbackend.dto.ProviderAmountResponse(
                p.providerName, COALESCE(SUM(p.amount), 0), COUNT(p))
            FROM PaymentSlip p
            WHERE p.user.id = :userId
            GROUP BY p.providerName
            ORDER BY p.providerName
            """)
    List<ProviderAmountResponse> sumAmountGroupedByProvider(@Param("userId") Long userId);

    @Query(value = """
            SELECT TO_CHAR(due_date, 'YYYY-MM') AS period, COALESCE(SUM(amount), 0) AS total
            FROM payment_slips
            WHERE user_id = :userId AND due_date IS NOT NULL
            GROUP BY period
            ORDER BY period
            """, nativeQuery = true)
    List<Object[]> sumAmountGroupedByMonth(@Param("userId") Long userId);

    @Query("""
            SELECT new com.sliptrack.sliptrackbackend.dto.AdminCategoryCountResponse(
                p.category.id, p.category.name, COUNT(p))
            FROM PaymentSlip p
            GROUP BY p.category.id, p.category.name
            ORDER BY COUNT(p) DESC
            """)
    List<AdminCategoryCountResponse> countGroupedByCategory();

    @Query("""
            SELECT new com.sliptrack.sliptrackbackend.dto.AdminSubCategoryCountResponse(
                p.subCategory.id, p.subCategory.name, p.category.id, COUNT(p))
            FROM PaymentSlip p
            WHERE p.subCategory IS NOT NULL
            GROUP BY p.subCategory.id, p.subCategory.name, p.category.id
            ORDER BY COUNT(p) DESC
            """)
    List<AdminSubCategoryCountResponse> countGroupedBySubCategory();
}
