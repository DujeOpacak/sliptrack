package com.sliptrack.sliptrackbackend.service;

import com.sliptrack.sliptrackbackend.dto.NotificationResponse;
import com.sliptrack.sliptrackbackend.model.Notification;
import com.sliptrack.sliptrackbackend.model.User;
import com.sliptrack.sliptrackbackend.repository.NotificationRepository;
import com.sliptrack.sliptrackbackend.security.CurrentUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final CurrentUserService currentUserService;

    public List<NotificationResponse> getAll() {
        User currentUser = currentUserService.getCurrentUser();

        return notificationRepository.findByUserIdOrderBySentAtDesc(currentUser.getId()).stream()
                .map(this::toResponse)
                .toList();
    }

    public NotificationResponse markAsRead(Long id) {
        User currentUser = currentUserService.getCurrentUser();

        Notification notification = notificationRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Obavijest ne postoji"));

        notification.setRead(true);

        return toResponse(notificationRepository.save(notification));
    }

    private NotificationResponse toResponse(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .message(notification.getMessage())
                .read(notification.getRead())
                .paymentSlipId(notification.getPaymentSlip() == null ? null : notification.getPaymentSlip().getId())
                .sentAt(notification.getSentAt())
                .build();
    }
}
