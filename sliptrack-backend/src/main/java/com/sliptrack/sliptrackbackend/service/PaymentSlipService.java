package com.sliptrack.sliptrackbackend.service;

import com.sliptrack.sliptrackbackend.dto.PaymentSlipAuditResponse;
import com.sliptrack.sliptrackbackend.dto.PaymentSlipRequest;
import com.sliptrack.sliptrackbackend.dto.PaymentSlipResponse;
import com.sliptrack.sliptrackbackend.dto.PaymentSlipStatusUpdateRequest;
import com.sliptrack.sliptrackbackend.enums.PaymentStatus;
import com.sliptrack.sliptrackbackend.model.*;
import com.sliptrack.sliptrackbackend.repository.*;
import com.sliptrack.sliptrackbackend.security.CurrentUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PaymentSlipService {

    private final PaymentSlipRepository paymentSlipRepository;
    private final PaymentSlipAuditRepository paymentSlipAuditRepository;
    private final CategoryRepository categoryRepository;
    private final SubCategoryRepository subCategoryRepository;
    private final PropertyRepository propertyRepository;
    private final CurrentUserService currentUserService;
    private final PaymentSlipImageService paymentSlipImageService;

    public List<PaymentSlipResponse> getAll(PaymentStatus status, Long categoryId, Long subCategoryId,
                                             String providerName, LocalDate dueDateFrom, LocalDate dueDateTo) {
        User currentUser = currentUserService.getCurrentUser();

        Specification<PaymentSlip> spec = (root, query, cb) -> cb.equal(root.get("user").get("id"), currentUser.getId());

        if (status != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), status));
        }
        if (categoryId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("category").get("id"), categoryId));
        }
        if (subCategoryId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("subCategory").get("id"), subCategoryId));
        }
        if (providerName != null && !providerName.isBlank()) {
            spec = spec.and((root, query, cb) -> cb.like(cb.lower(root.get("providerName")), "%" + providerName.toLowerCase() + "%"));
        }
        if (dueDateFrom != null) {
            spec = spec.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("dueDate"), dueDateFrom));
        }
        if (dueDateTo != null) {
            spec = spec.and((root, query, cb) -> cb.lessThanOrEqualTo(root.get("dueDate"), dueDateTo));
        }

        return paymentSlipRepository.findAll(spec).stream()
                .map(this::toResponse)
                .toList();
    }

    public PaymentSlipResponse getById(Long id) {
        return toResponse(findOwnedOrThrow(id));
    }

    public PaymentSlipResponse create(PaymentSlipRequest request) {
        User currentUser = currentUserService.getCurrentUser();

        Category category = findCategoryOrThrow(request.getCategoryId());
        SubCategory subCategory = resolveSubCategory(request.getSubCategoryId(), category);
        Property property = resolveProperty(request.getPropertyId(), subCategory, currentUser);

        PaymentSlip paymentSlip = PaymentSlip.builder()
                .iban(request.getIban())
                .amount(request.getAmount())
                .referenceNumber(request.getReferenceNumber())
                .paymentModel(request.getPaymentModel())
                .providerName(request.getProviderName())
                .description(request.getDescription())
                .dueDate(request.getDueDate())
                .status(PaymentStatus.UNPAID)
                .category(category)
                .subCategory(subCategory)
                .property(property)
                .user(currentUser)
                .scannedAt(request.isWasScanned() ? LocalDateTime.now() : null)
                .build();

        PaymentSlip saved = paymentSlipRepository.save(paymentSlip);

        return toResponse(saved, category, subCategory, property);
    }

    public PaymentSlipResponse update(Long id, PaymentSlipRequest request) {
        User currentUser = currentUserService.getCurrentUser();
        PaymentSlip paymentSlip = findOwnedOrThrow(id);

        Category category = findCategoryOrThrow(request.getCategoryId());
        SubCategory subCategory = resolveSubCategory(request.getSubCategoryId(), category);
        Property property = resolveProperty(request.getPropertyId(), subCategory, currentUser);

        paymentSlip.setIban(request.getIban());
        paymentSlip.setAmount(request.getAmount());
        paymentSlip.setReferenceNumber(request.getReferenceNumber());
        paymentSlip.setPaymentModel(request.getPaymentModel());
        paymentSlip.setProviderName(request.getProviderName());
        paymentSlip.setDescription(request.getDescription());
        paymentSlip.setDueDate(request.getDueDate());
        paymentSlip.setCategory(category);
        paymentSlip.setSubCategory(subCategory);
        paymentSlip.setProperty(property);

        PaymentSlip saved = paymentSlipRepository.save(paymentSlip);

        return toResponse(saved, category, subCategory, property);
    }

    public PaymentSlipResponse updateStatus(Long id, PaymentSlipStatusUpdateRequest request) {
        User currentUser = currentUserService.getCurrentUser();
        PaymentSlip paymentSlip = findOwnedOrThrow(id);

        PaymentStatus oldStatus = paymentSlip.getStatus();
        PaymentStatus newStatus = request.getStatus();

        paymentSlip.setStatus(newStatus);

        if (newStatus == PaymentStatus.PAID) {
            if (request.getPaidAt() != null) {
                paymentSlip.setPaidAt(request.getPaidAt());
            } else if (oldStatus != PaymentStatus.PAID) {
                paymentSlip.setPaidAt(LocalDate.now());
            }
            // ako je već bio PAID i paidAt nije poslan, zadržava se postojeći datum (ne prepisuje se na "danas")
        } else {
            paymentSlip.setPaidAt(null);
        }

        PaymentSlip saved = paymentSlipRepository.save(paymentSlip);

        if (oldStatus != newStatus) {
            PaymentSlipAudit audit = PaymentSlipAudit.builder()
                    .paymentSlip(paymentSlip)
                    .changedBy(currentUser)
                    .oldStatus(oldStatus)
                    .newStatus(newStatus)
                    .build();
            paymentSlipAuditRepository.save(audit);
        }

        return toResponse(saved, paymentSlip.getCategory(), paymentSlip.getSubCategory(), paymentSlip.getProperty());
    }

    public PaymentSlipResponse uploadImage(Long id, MultipartFile file) {
        User currentUser = currentUserService.getCurrentUser();
        PaymentSlip paymentSlip = findOwnedOrThrow(id);

        if (paymentSlip.getImageKey() != null) {
            paymentSlipImageService.delete(paymentSlip.getImageKey());
        }

        String key = paymentSlipImageService.upload(currentUser.getId(), id, file);
        paymentSlip.setImageKey(key);
        PaymentSlip saved = paymentSlipRepository.save(paymentSlip);

        return toResponse(saved, paymentSlip.getCategory(), paymentSlip.getSubCategory(), paymentSlip.getProperty());
    }

    @Transactional
    public void delete(Long id) {
        PaymentSlip paymentSlip = findOwnedOrThrow(id);
        paymentSlipAuditRepository.deleteByPaymentSlipId(id);
        paymentSlipRepository.delete(paymentSlip);

        if (paymentSlip.getImageKey() != null) {
            paymentSlipImageService.delete(paymentSlip.getImageKey());
        }
    }

    public List<PaymentSlipAuditResponse> getAudit(Long id) {
        findOwnedOrThrow(id);

        return paymentSlipAuditRepository.findByPaymentSlipIdOrderByChangedAtDesc(id).stream()
                .map(audit -> PaymentSlipAuditResponse.builder()
                        .id(audit.getId())
                        .oldStatus(audit.getOldStatus())
                        .newStatus(audit.getNewStatus())
                        .changedByEmail(audit.getChangedBy().getEmail())
                        .changedAt(audit.getChangedAt())
                        .build())
                .toList();
    }

    private PaymentSlip findOwnedOrThrow(Long id) {
        User currentUser = currentUserService.getCurrentUser();

        return paymentSlipRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Uplatnica ne postoji"));
    }

    private Category findCategoryOrThrow(Long categoryId) {
        return categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Kategorija ne postoji"));
    }

    private SubCategory resolveSubCategory(Long subCategoryId, Category category) {
        if (subCategoryId == null) {
            if (subCategoryRepository.existsByCategoryId(category.getId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Ova kategorija ima potkategorije — potkategorija je obavezna");
            }
            return null;
        }

        SubCategory subCategory = subCategoryRepository.findById(subCategoryId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Potkategorija ne postoji"));

        if (!subCategory.getCategory().getId().equals(category.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Potkategorija ne pripada odabranoj kategoriji");
        }

        return subCategory;
    }

    private Property resolveProperty(Long propertyId, SubCategory subCategory, User currentUser) {
        if (propertyId == null) {
            return null;
        }

        if (subCategory == null || !subCategory.isAllowsProperty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Odabrana potkategorija ne dopušta vezivanje uz nekretninu");
        }

        return propertyRepository.findByIdAndUserId(propertyId, currentUser.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Nekretnina ne postoji"));
    }

    private PaymentSlipResponse toResponse(PaymentSlip paymentSlip) {
        return toResponse(paymentSlip, paymentSlip.getCategory(), paymentSlip.getSubCategory(), paymentSlip.getProperty());
    }

    private PaymentSlipResponse toResponse(PaymentSlip paymentSlip, Category category, SubCategory subCategory, Property property) {
        return PaymentSlipResponse.builder()
                .id(paymentSlip.getId())
                .iban(paymentSlip.getIban())
                .amount(paymentSlip.getAmount())
                .referenceNumber(paymentSlip.getReferenceNumber())
                .paymentModel(paymentSlip.getPaymentModel())
                .providerName(paymentSlip.getProviderName())
                .description(paymentSlip.getDescription())
                .dueDate(paymentSlip.getDueDate())
                .status(paymentSlip.getStatus())
                .paidAt(paymentSlip.getPaidAt())
                .imageUrl(paymentSlipImageService.getPresignedUrl(paymentSlip.getImageKey()))
                .categoryId(category == null ? null : category.getId())
                .categoryName(category == null ? null : category.getName())
                .subCategoryId(subCategory == null ? null : subCategory.getId())
                .subCategoryName(subCategory == null ? null : subCategory.getName())
                .propertyId(property == null ? null : property.getId())
                .propertyName(property == null ? null : property.getName())
                .scannedAt(paymentSlip.getScannedAt())
                .createdAt(paymentSlip.getCreatedAt())
                .build();
    }
}
