package com.sliptrack.sliptrackbackend.controller;

import com.sliptrack.sliptrackbackend.dto.SubCategoryRequest;
import com.sliptrack.sliptrackbackend.dto.SubCategoryResponse;
import com.sliptrack.sliptrackbackend.service.SubCategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/subcategories")
@RequiredArgsConstructor
public class SubCategoryController {

    private final SubCategoryService subCategoryService;

    @GetMapping
    public ResponseEntity<List<SubCategoryResponse>> getAll(@RequestParam(required = false) Long categoryId) {
        return ResponseEntity.ok(subCategoryService.getAll(categoryId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SubCategoryResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(subCategoryService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SubCategoryResponse> create(@Valid @RequestBody SubCategoryRequest request) {
        return ResponseEntity.ok(subCategoryService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SubCategoryResponse> update(@PathVariable Long id, @Valid @RequestBody SubCategoryRequest request) {
        return ResponseEntity.ok(subCategoryService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        subCategoryService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
