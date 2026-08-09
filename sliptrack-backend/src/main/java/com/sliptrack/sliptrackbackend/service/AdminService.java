package com.sliptrack.sliptrackbackend.service;

import com.sliptrack.sliptrackbackend.dto.AdminCategoryCountResponse;
import com.sliptrack.sliptrackbackend.dto.AdminStatsResponse;
import com.sliptrack.sliptrackbackend.dto.AdminSubCategoryCountResponse;
import com.sliptrack.sliptrackbackend.dto.AdminUserResponse;
import com.sliptrack.sliptrackbackend.model.User;
import com.sliptrack.sliptrackbackend.repository.CategoryRepository;
import com.sliptrack.sliptrackbackend.repository.PaymentSlipRepository;
import com.sliptrack.sliptrackbackend.repository.SubCategoryRepository;
import com.sliptrack.sliptrackbackend.repository.UserRepository;
import com.sliptrack.sliptrackbackend.security.CurrentUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final PaymentSlipRepository paymentSlipRepository;
    private final CategoryRepository categoryRepository;
    private final SubCategoryRepository subCategoryRepository;
    private final CurrentUserService currentUserService;

    public List<AdminUserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public AdminUserResponse deactivate(Long id) {
        User currentAdmin = currentUserService.getCurrentUser();
        if (currentAdmin.getId().equals(id)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ne možete deaktivirati vlastiti račun");
        }

        User user = findUserOrThrow(id);
        user.setActive(false);

        return toResponse(userRepository.save(user));
    }

    public AdminUserResponse activate(Long id) {
        User user = findUserOrThrow(id);
        user.setActive(true);

        return toResponse(userRepository.save(user));
    }

    public AdminStatsResponse getStats() {
        return AdminStatsResponse.builder()
                .totalUsers(userRepository.count())
                .activeUsers(userRepository.countByActiveTrue())
                .totalPaymentSlips(paymentSlipRepository.count())
                .topCategories(categoryRepository.countGroupedByCategory().stream().limit(5).toList())
                .build();
    }

    public List<AdminCategoryCountResponse> getCategoryCounts() {
        return categoryRepository.countGroupedByCategory();
    }

    public List<AdminSubCategoryCountResponse> getSubCategoryCounts() {
        return subCategoryRepository.countGroupedBySubCategory();
    }

    private User findUserOrThrow(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Korisnik ne postoji"));
    }

    private AdminUserResponse toResponse(User user) {
        return AdminUserResponse.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .role(user.getRole())
                .active(user.getActive())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
