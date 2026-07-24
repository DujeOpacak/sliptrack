package com.sliptrack.sliptrackbackend.service;

import com.sliptrack.sliptrackbackend.dto.PropertyRequest;
import com.sliptrack.sliptrackbackend.dto.PropertyResponse;
import com.sliptrack.sliptrackbackend.model.Property;
import com.sliptrack.sliptrackbackend.model.User;
import com.sliptrack.sliptrackbackend.repository.PropertyRepository;
import com.sliptrack.sliptrackbackend.security.CurrentUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PropertyService {

    private final PropertyRepository propertyRepository;
    private final CurrentUserService currentUserService;

    public List<PropertyResponse> getAll() {
        User currentUser = currentUserService.getCurrentUser();

        return propertyRepository.findByUserId(currentUser.getId()).stream()
                .map(this::toResponse)
                .toList();
    }

    public PropertyResponse getById(Long id) {
        return toResponse(findOwnedOrThrow(id));
    }

    public PropertyResponse create(PropertyRequest request) {
        User currentUser = currentUserService.getCurrentUser();

        Property property = Property.builder()
                .name(request.getName())
                .address(request.getAddress())
                .user(currentUser)
                .build();

        return toResponse(propertyRepository.save(property));
    }

    public PropertyResponse update(Long id, PropertyRequest request) {
        Property property = findOwnedOrThrow(id);

        property.setName(request.getName());
        property.setAddress(request.getAddress());

        return toResponse(propertyRepository.save(property));
    }

    public void delete(Long id) {
        Property property = findOwnedOrThrow(id);
        propertyRepository.delete(property);
    }

    private Property findOwnedOrThrow(Long id) {
        User currentUser = currentUserService.getCurrentUser();

        return propertyRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Nekretnina ne postoji"));
    }

    private PropertyResponse toResponse(Property property) {
        return PropertyResponse.builder()
                .id(property.getId())
                .name(property.getName())
                .address(property.getAddress())
                .createdAt(property.getCreatedAt())
                .build();
    }
}
