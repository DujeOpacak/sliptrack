package com.sliptrack.sliptrackbackend.service;

import com.sliptrack.sliptrackbackend.dto.CategoryRequest;
import com.sliptrack.sliptrackbackend.dto.CategoryResponse;
import com.sliptrack.sliptrackbackend.model.Category;
import com.sliptrack.sliptrackbackend.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public List<CategoryResponse> getAll() {
        return categoryRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public CategoryResponse getById(Long id) {
        return toResponse(findByIdOrThrow(id));
    }

    public CategoryResponse create(CategoryRequest request) {
        if (categoryRepository.existsByName(request.getName())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Kategorija s ovim nazivom već postoji");
        }

        Category category = Category.builder()
                .name(request.getName())
                .build();

        return toResponse(categoryRepository.save(category));
    }

    public CategoryResponse update(Long id, CategoryRequest request) {
        Category category = findByIdOrThrow(id);

        if (!category.getName().equals(request.getName()) && categoryRepository.existsByName(request.getName())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Kategorija s ovim nazivom već postoji");
        }

        category.setName(request.getName());

        return toResponse(categoryRepository.save(category));
    }

    public void delete(Long id) {
        Category category = findByIdOrThrow(id);
        categoryRepository.delete(category);
    }

    private Category findByIdOrThrow(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Kategorija ne postoji"));
    }

    private CategoryResponse toResponse(Category category) {
        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .createdAt(category.getCreatedAt())
                .build();
    }
}
