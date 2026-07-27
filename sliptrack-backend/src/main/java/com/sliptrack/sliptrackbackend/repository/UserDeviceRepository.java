package com.sliptrack.sliptrackbackend.repository;

import com.sliptrack.sliptrackbackend.model.UserDevice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserDeviceRepository extends JpaRepository<UserDevice, Long> {

    Optional<UserDevice> findByDeviceToken(String deviceToken);

    Optional<UserDevice> findByIdAndUserId(Long id, Long userId);

    List<UserDevice> findByUserId(Long userId);
}
