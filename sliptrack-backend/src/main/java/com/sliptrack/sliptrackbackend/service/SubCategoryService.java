package com.sliptrack.sliptrackbackend.service;

import com.sliptrack.sliptrackbackend.dto.SubCategoryRequest;
import com.sliptrack.sliptrackbackend.dto.SubCategoryResponse;
import com.sliptrack.sliptrackbackend.model.Category;
import com.sliptrack.sliptrackbackend.model.SubCategory;
import com.sliptrack.sliptrackbackend.repository.CategoryRepository;
import com.sliptrack.sliptrackbackend.repository.SubCategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SubCategoryService {

    private final SubCategoryRepository subCategoryRepository;
    private final CategoryRepository categoryRepository;

    public List<SubCategoryResponse> getAll(Long categoryId) {
        List<SubCategory> subCategories = categoryId != null
                ? subCategoryRepository.findByCategoryId(categoryId)
                : subCategoryRepository.findAll();

        return subCategories.stream()
                .map(this::toResponse)
                .toList();
    }

    public SubCategoryResponse getById(Long id) {
        return toResponse(findByIdOrThrow(id));
    }

    public SubCategoryResponse create(SubCategoryRequest request) {
        Category category = findCategoryOrThrow(request.getCategoryId());

        if (subCategoryRepository.existsByNameAndCategoryId(request.getName(), category.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Potkategorija s ovim nazivom već postoji unutar ove kategorije");
        }

        SubCategory subCategory = SubCategory.builder()
                .name(request.getName())
                .allowsProperty(request.isAllowsProperty())
                .category(category)
                .build();

        return toResponse(subCategoryRepository.save(subCategory));
    }

    public SubCategoryResponse update(Long id, SubCategoryRequest request) {
        SubCategory subCategory = findByIdOrThrow(id);
        Category category = findCategoryOrThrow(request.getCategoryId());

        boolean nameOrCategoryChanged = !subCategory.getName().equals(request.getName())
                || !subCategory.getCategory().getId().equals(category.getId());

        if (nameOrCategoryChanged && subCategoryRepository.existsByNameAndCategoryId(request.getName(), category.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Potkategorija s ovim nazivom već postoji unutar ove kategorije");
        }

        subCategory.setName(request.getName());
        subCategory.setAllowsProperty(request.isAllowsProperty());
        subCategory.setCategory(category);

        SubCategory saved = subCategoryRepository.save(subCategory);

        return toResponse(saved, category);
    }

    public void delete(Long id) {
        SubCategory subCategory = findByIdOrThrow(id);
        subCategoryRepository.delete(subCategory);
    }

    private SubCategory findByIdOrThrow(Long id) {
        return subCategoryRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Potkategorija ne postoji"));
    }

    private Category findCategoryOrThrow(Long categoryId) {
        return categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Kategorija ne postoji"));
    }

    private SubCategoryResponse toResponse(SubCategory subCategory) {
        return toResponse(subCategory, subCategory.getCategory());
    }

    private SubCategoryResponse toResponse(SubCategory subCategory, Category category) {
        return SubCategoryResponse.builder()
                .id(subCategory.getId())
                .name(subCategory.getName())
                .allowsProperty(subCategory.isAllowsProperty())
                .categoryId(category.getId())
                .categoryName(category.getName())
                .createdAt(subCategory.getCreatedAt())
                .build();
    }
}
