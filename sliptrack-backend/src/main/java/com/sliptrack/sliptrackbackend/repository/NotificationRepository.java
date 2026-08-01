package com.sliptrack.sliptrackbackend.repository;

import com.sliptrack.sliptrackbackend.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByUserIdOrderBySentAtDesc(Long userId);

    Optional<Notification> findByIdAndUserId(Long id, Long userId);

    boolean existsByPaymentSlipIdAndMessageStartingWith(Long paymentSlipId, String prefix);
}
