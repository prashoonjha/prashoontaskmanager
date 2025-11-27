package com.example.taskmanager.util;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

public class PageableUtils {
  public static Pageable of(int page, int size, String sortBy, String dir) {
    Sort sort = (sortBy == null) ? Sort.unsorted()
        : Sort.by("desc".equalsIgnoreCase(dir) ? Sort.Direction.DESC : Sort.Direction.ASC, sortBy);
    return PageRequest.of(Math.max(0, page), Math.min(100, Math.max(1, size)), sort);
  }
}
