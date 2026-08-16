# Academic Year Architecture

## Overview

The AMS system uses a **year-scoped entities with automatic carry-forward** pattern to handle multiple academic years. This document explains the architectural decisions and patterns to prevent future bugs.

## Core Pattern: Year-Scoped Entities

### Year Hierarchy

The system uses a **transitive scoping** model through `ClassCourse`:

```
AcademicYear
    ↓
ClassCourse (has AcademicYearId)
    ↓
Subject (has ClassCourseId, indirectly scoped to year)
    ↓
TeacherSubjectAssignment (scoped via Subject)
Assignment (scoped via Subject)
Submission (scoped via Assignment)
```

### Entity Categories

#### 1. **Permanent Entities** (Never change between years)
- `User` (teacher, student, admin accounts)
- `ClassDefinition` (e.g., "Nine", "Ten", "Science" group)
- `Group` (subject groups like "Science", "Arts", "Commerce")

#### 2. **Year-Scoped Entities** (Created fresh per year)
- `ClassCourse` (school classes are recreated each year)
- `Subject` (subjects per class per year)
- `TeacherSubjectAssignment` (teacher-subject binding per year)
- `StudentEnrollment` (student-class binding per year)
- `Assignment` (assignments per year)
- `Submission` (submission records per year)

#### 3. **Read-Only Entities** (Archive policy)
- Once an academic year is deactivated, its year-scoped data is treated as **historical** and should not be modified
- Admins can view archived years (via `includeAllYears`/`includeAllAcademicYears` flags)
- Only the active year allows create/update/delete operations

## The Bug That Was Fixed

### Symptom
After activating a second academic year, classes appeared with:
- Zero subjects
- Zero teacher assignments
- Empty dashboards

**Root Cause:** `AcademicYearAppService.ActivateAsync()` auto-seeded `ClassCourse` rows but never copied over `Subject` and `TeacherSubjectAssignment` records. Since both are scoped to specific year-ClassCourse pairs, the new year's classes had no data.

### Solution: `CarryForwardStructureAsync`

When a new academic year is activated:

1. **Match classes** between old and new year by:
   - ClassDefinition ID
   - Section (e.g., "A")
   - Group (if applicable)

2. **For each matched class pair:**
   - Copy all `Subject` records (matching by name + code)
   - For each subject, copy all `TeacherSubjectAssignment` records

3. **Idempotent guarantees:**
   - Only creates if doesn't already exist (by name + code for subjects)
   - Won't duplicate or clobber manual edits

4. **Student enrollments are NOT auto-copied:**
   - Student promotion is a deliberate, per-student admin action
   - This is already implemented correctly in `StudentEnrollmentAppService.PromoteStudentAsync()`

## ViewingHistorical Data

### Backend Support

Every `GetAll` method for year-scoped services has an `includeAllYears`/`includeAllAcademicYears` parameter:

```csharp
// Example: SubjectAppService
public async Task<IReadOnlyList<SubjectDto>> GetAllAsync(
    Guid currentUserId, 
    string currentUserRole,
    bool includeAllAcademicYears = false,  // ← NEW
    CancellationToken cancellationToken = default)
{
    if (includeAllAcademicYears)
    {
        // Return all subjects from all years
        return await _subjectRepository.GetAllAsync(cancellationToken);
    }
    
    // Default: only active year
    var activeYear = await _academicYearRepository.GetActiveAsync(cancellationToken);
    return await _subjectRepository.GetByAcademicYearAsync(activeYear.Id, cancellationToken);
}
```

**Applies to:**
- `ClassCourseAppService`
- `SubjectAppService`
- `TeacherSubjectAssignmentAppService`

### Frontend UX

Admin pages (e.g., Classes & Subjects) now have:

1. **Year Selector Dropdown**
   - Shows all academic years (Active and Archived)
   - Default selection: Active year
   - Changing year reloads data for that year only

2. **Read-Only Banner**
   - Displayed when viewing archived year
   - Explains why edit/delete are disabled

3. **Disabled Operations**
   - Add class ✗
   - Add subject ✗
   - Edit class ✗
   - Delete class ✗
   - View subjects ✓ (read-only browsing allowed)

## Best Practices Going Forward

### ✅ DO

1. **Scope writes to active year only**
   ```csharp
   var activeYear = await _academicYearRepository.GetActiveAsync();
   if (activeYear is null || entity.AcademicYearId != activeYear.Id)
       throw new ValidationException("Can only modify current academic year data.");
   ```

2. **Use `includeAllYears` for admin reporting/audits**
   ```csharp
   // Admin viewing historical data for audit
   var allYearsData = await service.GetAllAsync(userId, role, includeAllYears: true);
   ```

3. **Carry forward structural data when activating years**
   ```csharp
   // AcademicYearAppService.ActivateAsync
   await EnsureClassesExistForYearAsync(year.Id);
   await CarryForwardStructureAsync(year.Id, previousYear?.Id);
   ```

4. **Keep history immutable**
   - Never modify or delete past-year data
   - Archive strategy: mark inactive, don't delete

### ❌ DON'T

1. **Don't auto-enroll students to new years**
   - Promotion is a deliberate admin action per student
   - Different students may advance to different classes

2. **Don't duplicate entity definitions (e.g., subjects)**
   - Use `CarryForwardStructureAsync` pattern instead
   - Ensures consistency and idempotency

3. **Don't filter by default without checking active year**
   ```csharp
   // WRONG: Assumes active year always exists
   var subjects = await _subjectRepository.GetByAcademicYearAsync(activeYear.Id);
   
   // RIGHT: Validate and handle null
   var activeYear = await _academicYearRepository.GetActiveAsync();
   if (activeYear is null) return new List<Subject>();
   var subjects = await _subjectRepository.GetByAcademicYearAsync(activeYear.Id);
   ```

4. **Don't expose `includeAllYears` in user-facing operations**
   - Only for admin/reporting APIs
   - Regular users should only see active-year data

## Testing Patterns

### Unit Tests

Mock repositories should properly handle year filtering:

```csharp
[Fact]
public async Task GetAllAsync_WhenIncludeAllYears_ReturnsAllYears()
{
    var repo = new Mock<ISubjectRepository>();
    var year1Subjects = new[] { /* ... */ };
    var year2Subjects = new[] { /* ... */ };
    
    repo.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
        .ReturnsAsync(year1Subjects.Concat(year2Subjects).ToList());
    repo.Setup(r => r.GetByAcademicYearAsync(activeYearId, It.IsAny<CancellationToken>()))
        .ReturnsAsync(year1Subjects);
    
    var service = new SubjectAppService(repo.Object, /* ... */);
    var allYears = await service.GetAllAsync(userId, "Admin", includeAllAcademicYears: true);
    
    Assert.Equal(year1Subjects.Length + year2Subjects.Length, allYears.Count);
}
```

### Integration Tests

Test the full carry-forward workflow:

```csharp
[Fact]
public async Task ActivateAsync_CarriesForwardSubjectsAndTeachers()
{
    // Arrange: Set up year 1 with subjects and teachers
    var year1 = await CreateAcademicYear("2024-2025", isActive: true);
    var class1 = await CreateClassCourse(year1.Id, "Nine", "A");
    var subject1 = await CreateSubject(class1.Id, "Math", "MATH101");
    var teacher = await CreateTeacher();
    await AssignTeacher(teacher.Id, subject1.Id);
    
    // Act: Activate year 2
    var year2 = await CreateAcademicYear("2025-2026", isActive: false);
    await yearService.ActivateAsync(year2.Id, adminId, "Admin");
    
    // Assert: Year 2 has auto-seeded classes with carried-forward subjects
    var year2Classes = await classService.GetAllAsync(adminId, "Admin", includeAllYears: false);
    var year2Class = year2Classes.Single(c => c.Name == "Nine" && c.Section == "A");
    
    var year2Subjects = await subjectService.GetAllAsync(adminId, "Admin", false);
    var carriedSubject = year2Subjects.Single(s => s.Name == "Math" && s.ClassCourseId == year2Class.Id);
    
    var assignments = await assignmentService.GetAllAsync(adminId, "Admin", false);
    var carriedAssignment = assignments.Single(a => a.TeacherId == teacher.Id && a.SubjectId == carriedSubject.Id);
    
    Assert.NotNull(carriedAssignment);
}
```

## Migration Notes

### For Existing Installations

If upgrading from a single-year system to multi-year:

1. First activate the new year (triggers `ActivateAsync`)
2. `CarryForwardStructureAsync` automatically copies subjects/teachers
3. Admins manually promote students via `StudentEnrollmentAppService.PromoteStudentAsync()`
4. Previous year becomes read-only (via `includeAllYears: false` default)

### DI Registration

Ensure all services have required repository dependencies:

```csharp
services.AddScoped<IAcademicYearAppService>(sp =>
    new AcademicYearAppService(
        sp.GetRequiredService<IAcademicYearRepository>(),
        sp.GetRequiredService<IClassCourseRepository>(),
        sp.GetRequiredService<IClassDefinitionRepository>(),
        sp.GetRequiredService<IGroupRepository>(),
        sp.GetRequiredService<ISubjectRepository>(),        // ← REQUIRED
        sp.GetRequiredService<ITeacherSubjectAssignmentRepository>()  // ← REQUIRED
    ));
```

## Summary

This architecture enables:

- ✅ **Multiple academic years** with automatic structural carry-forward
- ✅ **Immutable history** (archived years are read-only)
- ✅ **Flexible reporting** (admin can view any year)
- ✅ **Explicit student promotion** (manual, per-student action)
- ✅ **Idempotent operations** (safe to re-run without duplication)

The key mental model: **Year-scoped data is copied on activation, not mutated when switching.**
