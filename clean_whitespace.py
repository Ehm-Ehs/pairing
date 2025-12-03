
import os

file_path = '/Users/mac/Desktop/me/random-selection/src/components/landing/LandingPage.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace non-breaking space with regular space
cleaned_content = content.replace('\u00A0', ' ')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(cleaned_content)

print("Cleaned LandingPage.tsx")
