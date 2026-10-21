package com.speechapp.controller;

import com.speechapp.model.Transcription;
import com.speechapp.service.TranscriptionService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/transcriptions")
@CrossOrigin(origins = "*")
public class TranscriptionController {

    @Autowired
    private TranscriptionService service;

    @GetMapping
    public ResponseEntity<List<Transcription>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Transcription> getById(@PathVariable Long id) {
        return service.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Transcription> create(@Valid @RequestBody Transcription transcription) {
        Transcription saved = service.save(transcription);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Transcription> update(@PathVariable Long id, @Valid @RequestBody Transcription transcription) {
        return service.update(id, transcription)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> delete(@PathVariable Long id) {
        if (service.delete(id)) {
            return ResponseEntity.ok(Map.of("message", "Transcription deleted successfully"));
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping
    public ResponseEntity<Map<String, String>> deleteAll() {
        service.deleteAll();
        return ResponseEntity.ok(Map.of("message", "All transcriptions deleted"));
    }

    @GetMapping("/search")
    public ResponseEntity<List<Transcription>> search(@RequestParam String q) {
        return ResponseEntity.ok(service.search(q));
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(Map.of(
            "totalTranscriptions", service.count()
        ));
    }
}
