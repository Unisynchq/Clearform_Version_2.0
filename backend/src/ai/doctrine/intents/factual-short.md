# Intent: factual_short

Short factual questions where brevity is correct by design.

## Examples

- Email, phone, city, age, zip code
- "How many years of relevant experience do you have?"
- "How many people on your team?"
- "What is your expected salary range?" (when numeric)

## NOT this intent

- "How was your onboarding experience?" → experience_narrative
- "Describe your biggest achievement" → achievement

## Rubric

| Signal | Criteria |
|--------|----------|
| GREEN | Direct, unambiguous answer to the exact fact asked (number, email, "none", "0 years", "student with no experience") |
| AMBER | On-topic but vague or hedged ("like 3 years", "some experience") when owner wants precision |
| RED | Gibberish, off-topic, or refuses to answer |

## Completeness

- "I have 23 years of experience" → GREEN (answers how many)
- "I have no experience because I'm a student" → GREEN (answers how many: zero)
- "so i have like 3 years" → AMBER if owner wants a clear number; GREEN if owner accepts approximate answers
- Skip length penalties entirely.

## Coaching

Never ask them to "describe your experience with this form" on job-application questions.
Reference the form's purpose from `formPurpose` when clarifying what "relevant" means.
