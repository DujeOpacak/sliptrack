package com.sliptrack.sliptrackbackend.repository;

import com.sliptrack.sliptrackbackend.dto.AdminCategoryCountResponse;
import com.sliptrack.sliptrackbackend.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, Long> {

    boolean existsByName(String name);

    // left join od kategorije tako da se prikazu i kategorije bez uplatnica
    @Query("""
            SELECT new com.sliptrack.sliptrackbackend.dto.AdminCategoryCountResponse(
                c.id, c.name, COUNT(p))
            FROM Category c LEFT JOIN PaymentSlip p ON p.category = c
            GROUP BY c.id, c.name
            ORDER BY COUNT(p) DESC, c.name
            """)
    List<AdminCategoryCountResponse> countGroupedByCategory();
}
