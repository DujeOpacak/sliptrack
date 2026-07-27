package com.sliptrack.sliptrackbackend.service;

import com.sliptrack.sliptrackbackend.dto.UserDeviceRequest;
import com.sliptrack.sliptrackbackend.dto.UserDeviceResponse;
import com.sliptrack.sliptrackbackend.model.User;
import com.sliptrack.sliptrackbackend.model.UserDevice;
import com.sliptrack.sliptrackbackend.repository.UserDeviceRepository;
import com.sliptrack.sliptrackbackend.security.CurrentUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class UserDeviceService {

    private final UserDeviceRepository userDeviceRepository;
    private final CurrentUserService currentUserService;

    public UserDeviceResponse register(UserDeviceRequest request) {
        User currentUser = currentUserService.getCurrentUser();

        UserDevice device = userDeviceRepository.findByDeviceToken(request.getDeviceToken())
                .orElseGet(UserDevice::new);

        device.setUser(currentUser);
        device.setDeviceToken(request.getDeviceToken());
        device.setPlatform(request.getPlatform());

        return toResponse(userDeviceRepository.save(device));
    }

    public void delete(Long id) {
        User currentUser = currentUserService.getCurrentUser();

        UserDevice device = userDeviceRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Uređaj ne postoji"));

        userDeviceRepository.delete(device);
    }

    private UserDeviceResponse toResponse(UserDevice device) {
        return UserDeviceResponse.builder()
                .id(device.getId())
                .deviceToken(device.getDeviceToken())
                .platform(device.getPlatform())
                .createdAt(device.getCreatedAt())
                .updatedAt(device.getUpdatedAt())
                .build();
    }
}
