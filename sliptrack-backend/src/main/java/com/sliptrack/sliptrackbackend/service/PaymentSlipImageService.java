package com.sliptrack.sliptrackbackend.service;

import io.minio.GetPresignedObjectUrlArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectArgs;
import io.minio.http.Method;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.InputStream;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class PaymentSlipImageService {

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of("image/jpeg", "image/png");
    private static final long MAX_FILE_SIZE_BYTES = 10L * 1024 * 1024;
    private static final int PRESIGNED_URL_EXPIRY_MINUTES = 15;

    private final MinioClient minioClient;

    @Value("${minio.bucket}")
    private String bucket;

    public String upload(Long userId, Long paymentSlipId, MultipartFile file) {
        validate(file);

        String extension = "image/png".equals(file.getContentType()) ? "png" : "jpg";
        String key = "payment-slips/%d/%d/%s.%s".formatted(userId, paymentSlipId, UUID.randomUUID(), extension);

        try (InputStream inputStream = file.getInputStream()) {
            minioClient.putObject(PutObjectArgs.builder()
                    .bucket(bucket)
                    .object(key)
                    .stream(inputStream, file.getSize(), -1)
                    .contentType(file.getContentType())
                    .build());
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Slika se nije uspjela pohraniti");
        }

        return key;
    }

    public void delete(String key) {
        if (key == null) {
            return;
        }

        try {
            minioClient.removeObject(RemoveObjectArgs.builder().bucket(bucket).object(key).build());
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Slika se nije uspjela obrisati");
        }
    }

    public String getPresignedUrl(String key) {
        if (key == null) {
            return null;
        }

        try {
            return minioClient.getPresignedObjectUrl(GetPresignedObjectUrlArgs.builder()
                    .method(Method.GET)
                    .bucket(bucket)
                    .object(key)
                    .expiry(PRESIGNED_URL_EXPIRY_MINUTES, TimeUnit.MINUTES)
                    .build());
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "URL slike se nije uspio generirati");
        }
    }

    private void validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Slika je obavezna");
        }
        if (!ALLOWED_CONTENT_TYPES.contains(file.getContentType())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Dopušteni formati slike su JPEG i PNG");
        }
        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Slika je prevelika (maksimalno 10MB)");
        }
    }
}
