package com.speechapp.repository;

import com.speechapp.model.Transcription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TranscriptionRepository extends JpaRepository<Transcription, Long> {

    List<Transcription> findAllByOrderByCreatedAtDesc();

    @Query("SELECT t FROM Transcription t WHERE LOWER(t.text) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(t.title) LIKE LOWER(CONCAT('%', :keyword, '%')) ORDER BY t.createdAt DESC")
    List<Transcription> searchByKeyword(String keyword);

    long countByLanguageCode(String languageCode);
}
