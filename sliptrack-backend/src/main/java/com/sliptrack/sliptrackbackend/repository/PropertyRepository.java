package com.sliptrack.sliptrackbackend.repository;

import com.sliptrack.sliptrackbackend.model.Property;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PropertyRepository extends JpaRepository<Property, Long> {

    List<Property> findByUserId(Long userId);

    Optional<Property> findByIdAndUserId(Long id, Long userId);
}
