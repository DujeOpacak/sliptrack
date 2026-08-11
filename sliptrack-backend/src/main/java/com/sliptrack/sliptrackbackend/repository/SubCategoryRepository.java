package com.sliptrack.sliptrackbackend.repository;

import com.sliptrack.sliptrackbackend.dto.AdminSubCategoryCountResponse;
import com.sliptrack.sliptrackbackend.model.SubCategory;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface SubCategoryRepository extends JpaRepository<SubCategory, Long> {

    boolean existsByNameAndCategoryId(String name, Long categoryId);

    boolean existsByCategoryId(Long categoryId);

    @Override
    @EntityGraph(attributePaths = "category")
    List<SubCategory> findAll();

    @Override
    @EntityGraph(attributePaths = "category")
    Optional<SubCategory> findById(Long id);

    @EntityGraph(attributePaths = "category")
    List<SubCategory> findByCategoryId(Long categoryId);

    // left join tako da se subcategory bez uplatnica i dalje prikazuje s 0
    @Query("""
            SELECT new com.sliptrack.sliptrackbackend.dto.AdminSubCategoryCountResponse(
                s.id, s.name, s.category.id, COUNT(p))
            FROM SubCategory s LEFT JOIN PaymentSlip p ON p.subCategory = s
            GROUP BY s.id, s.name, s.category.id
            ORDER BY COUNT(p) DESC, s.name
            """)
    List<AdminSubCategoryCountResponse> countGroupedBySubCategory();
}
