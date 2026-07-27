package com.sliptrack.sliptrackbackend.controller;

import com.sliptrack.sliptrackbackend.dto.UserDeviceRequest;
import com.sliptrack.sliptrackbackend.dto.UserDeviceResponse;
import com.sliptrack.sliptrackbackend.service.UserDeviceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/devices")
@RequiredArgsConstructor
public class UserDeviceController {

    private final UserDeviceService userDeviceService;

    @PostMapping
    public ResponseEntity<UserDeviceResponse> register(@Valid @RequestBody UserDeviceRequest request) {
        return ResponseEntity.ok(userDeviceService.register(request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        userDeviceService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
