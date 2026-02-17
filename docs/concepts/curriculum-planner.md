---
title: "Curriculum Planner"
summary: "Generate personalized learning paths for your projects"
read_when:
  - You want Clawtopus to learn about new frameworks/languages
  - You want structured onboarding for new team members
---

# Curriculum Planner 📚

Curriculum Planner generates structured learning paths to help Clawtopus understand new technologies, frameworks, or codebases.

## How It Works

1. **Project Analysis**: Analyzes your project structure, dependencies, and code patterns
2. **Topic Generation**: Creates a curriculum with modules covering key areas
3. **Task Creation**: Each module has tasks with specific learning objectives
4. **Progressive Learning**: Clawtopus works through tasks to build understanding

## Storage

- Curricula: `~/.clawtopus/voyager/curriculum/`
- Each curriculum: `curriculum-{timestamp}.json`

## CLI Commands

```bash
# Generate a curriculum for a target (language, framework, project)
clawtopus memory curriculum plan <target>

# List all saved curricula
clawtopus memory curriculum list

# Show curriculum details
clawtopus memory curriculum show <id>
```

## Example

```bash
# Generate a curriculum for learning React
clawtopus memory curriculum plan React

# Output:
# Curriculum: React Development
# - Module 1: React Fundamentals (5 tasks)
# - Module 2: Hooks & State (7 tasks)
# - Module 3: Performance Optimization (4 tasks)
# - Module 4: Testing React Apps (5 tasks)
```

## Curriculum Schema

```typescript
interface Curriculum {
  id: string;
  name: string;
  description: string;
  target: string; // e.g., "React", "Python", "Kubernetes"
  modules: CurriculumModule[];
  createdAt: number;
  updatedAt: number;
}

interface CurriculumModule {
  id: string;
  title: string;
  description: string;
  tasks: CurriculumTask[];
}

interface CurriculumTask {
  id: string;
  title: string;
  description: string;
  type: "read" | "practice" | "quiz";
  resources: string[]; // URLs or file paths
  completed: boolean;
}
```

## Configuration

```json5
{
  agents: {
    defaults: {
      curriculumPlanner: {
        enabled: true,
        maxModules: 10,
        tasksPerModule: 5,
      },
    },
  },
}
```
