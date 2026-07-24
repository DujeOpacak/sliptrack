package com.sliptrack.sliptrackbackend.repository;

import com.sliptrack.sliptrackbackend.model.SubCategory;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

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
}
