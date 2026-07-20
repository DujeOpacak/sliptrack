package com.sliptrack.sliptrackbackend.repository;

import com.sliptrack.sliptrackbackend.model.RefreshToken;
import com.sliptrack.sliptrackbackend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByTokenHash(String tokenHash);

    void deleteAllByUser(User user);
}
