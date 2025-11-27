package com.example.taskmanager.common;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestControllerAdvice
public class GlobalExceptionHandler {
  @ExceptionHandler({ IllegalArgumentException.class })
  public ResponseEntity<ApiError> handleBadRequest(Exception ex) {
    var err = new ApiError(Instant.now(), 400, "Bad Request", ex.getMessage(), List.of());
    return ResponseEntity.badRequest().body(err);
  }

  @ExceptionHandler({ MethodArgumentNotValidException.class, BindException.class })
  public ResponseEntity<ApiError> handleValidation(Exception ex) {
    var err = new ApiError(Instant.now(), 422, "Validation Failed", ex.getMessage(), List.of());
    return ResponseEntity.status(422).body(err);
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ApiError> handleOther(Exception ex) {
    var err = new ApiError(Instant.now(), 500, "Internal Server Error", ex.getMessage(), List.of());
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(err);
  }
}
