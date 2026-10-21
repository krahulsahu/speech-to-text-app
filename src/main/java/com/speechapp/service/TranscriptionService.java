package com.speechapp.service;

import com.speechapp.model.Transcription;
import com.speechapp.repository.TranscriptionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class TranscriptionService {

    @Autowired
    private TranscriptionRepository repository;

    public List<Transcription> getAll() {
        return repository.findAllByOrderByCreatedAtDesc();
    }

    public Optional<Transcription> getById(Long id) {
        return repository.findById(id);
    }

    public Transcription save(Transcription transcription) {
        return repository.save(transcription);
    }

    public Optional<Transcription> update(Long id, Transcription updated) {
        return repository.findById(id).map(existing -> {
            existing.setText(updated.getText());
            existing.setTitle(updated.getTitle());
            existing.setLanguageCode(updated.getLanguageCode());
            existing.setDurationSeconds(updated.getDurationSeconds());
            return repository.save(existing);
        });
    }

    public boolean delete(Long id) {
        if (repository.existsById(id)) {
            repository.deleteById(id);
            return true;
        }
        return false;
    }

    public void deleteAll() {
        repository.deleteAll();
    }

    public List<Transcription> search(String keyword) {
        return repository.searchByKeyword(keyword);
    }

    public long count() {
        return repository.count();
    }
}
