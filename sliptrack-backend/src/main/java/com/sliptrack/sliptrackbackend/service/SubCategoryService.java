package com.sliptrack.sliptrackbackend.service;

import com.sliptrack.sliptrackbackend.dto.SubCategoryRequest;
import com.sliptrack.sliptrackbackend.dto.SubCategoryResponse;
import com.sliptrack.sliptrackbackend.model.Category;
import com.sliptrack.sliptrackbackend.model.SubCategory;
import com.sliptrack.sliptrackbackend.repository.CategoryRepository;
import com.sliptrack.sliptrackbackend.repository.PaymentSlipRepository;
import com.sliptrack.sliptrackbackend.repository.SubCategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SubCategoryService {

    private final SubCategoryRepository subCategoryRepository;
    private final CategoryRepository categoryRepository;
    private final PaymentSlipRepository paymentSlipRepository;

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

    @Transactional
    public SubCategoryResponse update(Long id, SubCategoryRequest request) {
        SubCategory subCategory = findByIdOrThrow(id);
        Category category = findCategoryOrThrow(request.getCategoryId());
        Long previousCategoryId = subCategory.getCategory().getId();
        boolean categoryChanged = !previousCategoryId.equals(category.getId());

        boolean nameOrCategoryChanged = !subCategory.getName().equals(request.getName()) || categoryChanged;

        if (nameOrCategoryChanged && subCategoryRepository.existsByNameAndCategoryId(request.getName(), category.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Potkategorija s ovim nazivom već postoji unutar ove kategorije");
        }

        if (subCategory.isAllowsProperty() && !request.isAllowsProperty()
                && paymentSlipRepository.existsBySubCategoryIdAndPropertyIsNotNull(id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Potkategorija ima uplatnice s dodijeljenom nekretninom — ne može se ukloniti dopuštanje nekretnine");
        }

        subCategory.setName(request.getName());
        subCategory.setAllowsProperty(request.isAllowsProperty());
        subCategory.setCategory(category);

        SubCategory saved = subCategoryRepository.save(subCategory);

        // Ako se promijeni kategorija unutar koje se nalazi ova potkategorija, moraju sve uplatnice imati referencu na novu kategoriju
        if (categoryChanged) {
            paymentSlipRepository.reassignCategoryForSubCategory(id, category);
        }

        return toResponse(saved, category);
    }

    public void delete(Long id) {
        SubCategory subCategory = findByIdOrThrow(id);

        if (paymentSlipRepository.existsBySubCategoryId(id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Potkategorija se koristi na postojećim uplatnicama — ne može se obrisati");
        }

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
