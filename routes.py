import os
import json
from datetime import datetime, date, timedelta
from sqlalchemy import func, extract
from flask import render_template, request, jsonify, redirect, url_for, flash, send_from_directory
from werkzeug.utils import secure_filename
import PyPDF2
import pandas as pd
import re
from app import app, db
from models import DailyStats, Section, Task, WorkingSession, AudioFile, Settings

# File upload configuration
ALLOWED_EXTENSIONS = {'pdf', 'csv', 'xlsx', 'xls', 'mp3', 'wav', 'ogg', 'm4a'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    # Get today's stats
    today = date.today()
    daily_stats = DailyStats.query.filter_by(date=today).first()
    
    if not daily_stats:
        daily_stats = DailyStats(date=today)
        db.session.add(daily_stats)
        db.session.commit()
    
    # Get recent sections with tasks
    sections = Section.query.order_by(Section.updated_at.desc()).limit(5).all()
    
    # Get today's working sessions
    working_sessions = WorkingSession.query.filter_by(date=today).all()
    
    # Get active audio file
    active_audio = AudioFile.query.filter_by(is_active=True).first()
    
    # Get all audio files
    audio_files = AudioFile.query.order_by(AudioFile.created_at.desc()).all()
    
    # Get settings
    music_enabled = Settings.query.filter_by(key='music_enabled').first()
    pomodoro_duration = Settings.query.filter_by(key='pomodoro_duration').first()
    break_duration = Settings.query.filter_by(key='break_duration').first()
    
    return render_template('index.html',
                         daily_stats=daily_stats,
                         sections=sections,
                         working_sessions=working_sessions,
                         active_audio=active_audio,
                         audio_files=audio_files,
                         music_enabled=music_enabled.value if music_enabled else 'false',
                         pomodoro_duration=int(pomodoro_duration.value) if pomodoro_duration else 25,
                         break_duration=int(break_duration.value) if break_duration else 5,
                         date=date)

@app.route('/sections')
def sections():
    sections = Section.query.order_by(Section.created_at.desc()).all()
    return render_template('sections.html', sections=sections)

@app.route('/section/<int:section_id>')
def section_detail(section_id):
    section = Section.query.get_or_404(section_id)
    tasks = Task.query.filter_by(section_id=section_id).order_by(Task.created_at.asc()).all()
    return render_template('tasks.html', section=section, tasks=tasks)

@app.route('/create_section', methods=['POST'])
def create_section():
    name = request.form.get('name')
    description = request.form.get('description')
    
    if not name:
        flash('Section name is required', 'error')
        return redirect(url_for('sections'))
    
    section = Section(name=name, description=description)
    db.session.add(section)
    db.session.commit()
    
    flash('Section created successfully', 'success')
    return redirect(url_for('sections'))

@app.route('/edit_section/<int:section_id>', methods=['POST'])
def edit_section(section_id):
    try:
        section = Section.query.get_or_404(section_id)
        name = request.form.get('name', '').strip()
        description = request.form.get('description', '').strip()
        
        if not name:
            flash('Section name is required', 'error')
            return redirect(request.referrer or url_for('sections'))
        
        # Update section details
        section.name = name
        section.description = description if description else None
        section.updated_at = datetime.utcnow()
        
        db.session.commit()
        flash('Section updated successfully', 'success')
        return redirect(url_for('sections'))
        
    except Exception as e:
        db.session.rollback()
        app.logger.error(f'Error updating section: {str(e)}')
        flash('An error occurred while updating the section', 'error')
        return redirect(request.referrer or url_for('sections'))

@app.route('/delete_section/<int:section_id>', methods=['POST'])
def delete_section(section_id):
    section = Section.query.get_or_404(section_id)
    db.session.delete(section)
    db.session.commit()
    
    flash('Section deleted successfully', 'success')
    return redirect(url_for('sections'))

@app.route('/create_task', methods=['POST'])
def create_task():
    section_id = request.form.get('section_id')
    name = request.form.get('name')
    description = request.form.get('description')
    youtube_link = request.form.get('youtube_link')
    resource_link = request.form.get('resource_link')
    practice_link = request.form.get('practice_link')
    priority = request.form.get('priority', 'medium')
    
    if not name or not section_id:
        flash('Task name and section are required', 'error')
        return redirect(url_for('section_detail', section_id=section_id))
    
    task = Task(
        name=name,
        description=description,
        youtube_link=youtube_link,
        resource_link=resource_link,
        practice_link=practice_link,
        priority=priority,
        section_id=section_id
    )
    
    db.session.add(task)
    db.session.commit()
    
    flash('Task created successfully', 'success')
    return redirect(url_for('section_detail', section_id=section_id))

@app.route('/edit_task/<int:task_id>', methods=['POST'])
def edit_task(task_id):
    try:
        task = Task.query.get_or_404(task_id)
        name = request.form.get('name', '').strip()
        
        if not name:
            flash('Task name is required', 'error')
            return redirect(request.referrer or url_for('section_detail', section_id=task.section_id))
        
        # Update task details
        task.name = name
        task.description = request.form.get('description', '').strip() or None
        task.youtube_link = request.form.get('youtube_link', '').strip() or None
        task.resource_link = request.form.get('resource_link', '').strip() or None
        task.practice_link = request.form.get('practice_link', '').strip() or None
        task.priority = request.form.get('priority', 'medium')
        task.updated_at = datetime.utcnow()
        
        db.session.commit()
        flash('Task updated successfully', 'success')
        return redirect(url_for('section_detail', section_id=task.section_id))
        
    except Exception as e:
        db.session.rollback()
        app.logger.error(f'Error updating task: {str(e)}')
        flash('An error occurred while updating the task', 'error')
        return redirect(request.referrer or url_for('section_detail', section_id=task.section_id if 'task' in locals() else None))

@app.route('/delete_task/<int:task_id>', methods=['POST'])
def delete_task(task_id):
    task = Task.query.get_or_404(task_id)
    section_id = task.section_id
    db.session.delete(task)
    db.session.commit()
    
    flash('Task deleted successfully', 'success')
    return redirect(url_for('section_detail', section_id=section_id))

@app.route('/complete_task/<int:task_id>', methods=['POST'])
def complete_task(task_id):
    task = Task.query.get_or_404(task_id)
    task.is_completed = not task.is_completed
    task.completed_at = datetime.utcnow() if task.is_completed else None
    
    # Update daily stats
    today = date.today()
    daily_stats = DailyStats.query.filter_by(date=today).first()
    if not daily_stats:
        daily_stats = DailyStats(date=today)
        db.session.add(daily_stats)
    
    if task.is_completed:
        daily_stats.tasks_completed += 1
        # Auto-update streak based on tasks completed
        update_streak_based_on_tasks(daily_stats)
    else:
        daily_stats.tasks_completed = max(0, daily_stats.tasks_completed - 1)
    
    db.session.commit()
    flash('Task status updated', 'success')
    return redirect(url_for('section_detail', section_id=task.section_id))

def update_streak_based_on_tasks(daily_stats):
    """Auto-update streak based on tasks completed"""
    tasks_completed = daily_stats.tasks_completed
    
    # Update streak based on task milestones
    if tasks_completed >= 1:
        daily_stats.streak_count = max(daily_stats.streak_count, 1)
    if tasks_completed >= 3:
        daily_stats.streak_count = max(daily_stats.streak_count, 3)
    if tasks_completed >= 5:
        daily_stats.streak_count = max(daily_stats.streak_count, 5)
    if tasks_completed >= 10:
        daily_stats.streak_count = max(daily_stats.streak_count, 10)

@app.route('/upload_file', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        flash('No file selected', 'error')
        return redirect(url_for('index'))
    
    file = request.files['file']
    if file.filename == '':
        flash('No file selected', 'error')
        return redirect(url_for('index'))
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        
        # Parse file based on extension
        file_ext = filename.rsplit('.', 1)[1].lower()
        
        if file_ext == 'pdf':
            parse_pdf(file_path)
        elif file_ext in ['csv', 'xlsx', 'xls']:
            parse_spreadsheet(file_path)
        elif file_ext in ['mp3', 'wav', 'ogg', 'm4a']:
            # Deactivate all existing audio files
            AudioFile.query.update({'is_active': False})
            
            # Save audio file info and make it active
            audio_file = AudioFile(
                filename=filename,
                original_filename=file.filename,
                file_path=file_path,
                file_size=os.path.getsize(file_path),
                is_active=True
            )
            db.session.add(audio_file)
            db.session.commit()
            flash('Audio file uploaded and activated successfully', 'success')
        
        return redirect(url_for('index'))
    
    flash('Invalid file type', 'error')
    return redirect(url_for('index'))

def parse_pdf(file_path):
    try:
        with open(file_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            text = ''
            for page in reader.pages:
                text += page.extract_text()
        
        # Extract information using regex patterns
        tasks = extract_tasks_from_text(text)
        
        # Create a new section for imported tasks
        section_name = f"Imported from PDF - {datetime.now().strftime('%Y-%m-%d %H:%M')}"
        section = Section(name=section_name, description="Tasks imported from PDF file")
        db.session.add(section)
        db.session.flush()
        
        # Add tasks to the section
        for task_data in tasks:
            task = Task(
                name=task_data['name'],
                youtube_link=task_data.get('youtube_link'),
                resource_link=task_data.get('resource_link'),
                practice_link=task_data.get('practice_link'),
                section_id=section.id
            )
            db.session.add(task)
        
        db.session.commit()
        flash(f'PDF parsed successfully. Created {len(tasks)} tasks.', 'success')
        
    except Exception as e:
        flash(f'Error parsing PDF: {str(e)}', 'error')

def parse_spreadsheet(file_path):
    try:
        # Read the file
        if file_path.endswith('.csv'):
            df = pd.read_csv(file_path)
        else:
            df = pd.read_excel(file_path)
        
        # Create a new section for imported tasks
        section_name = f"Imported from Spreadsheet - {datetime.now().strftime('%Y-%m-%d %H:%M')}"
        section = Section(name=section_name, description="Tasks imported from spreadsheet")
        db.session.add(section)
        db.session.flush()
        
        # Process each row
        tasks_created = 0
        for index, row in df.iterrows():
            if len(row) >= 3:
                task_name = str(row.iloc[0]) if pd.notna(row.iloc[0]) else f"Task {index + 1}"
                youtube_link = str(row.iloc[1]) if pd.notna(row.iloc[1]) else None
                practice_link = str(row.iloc[2]) if pd.notna(row.iloc[2]) else None
                resource_link = str(row.iloc[3]) if len(row) > 3 and pd.notna(row.iloc[3]) else None
                
                task = Task(
                    name=task_name,
                    youtube_link=youtube_link,
                    practice_link=practice_link,
                    resource_link=resource_link,
                    section_id=section.id
                )
                db.session.add(task)
                tasks_created += 1
        
        db.session.commit()
        flash(f'Spreadsheet parsed successfully. Created {tasks_created} tasks.', 'success')
        
    except Exception as e:
        flash(f'Error parsing spreadsheet: {str(e)}', 'error')

def extract_tasks_from_text(text):
    tasks = []
    
    # Pattern to find potential task names (lines that look like tasks)
    task_patterns = [
        r'(?:Task|TODO|Assignment|Exercise|Problem|Question)[\s:]*([^\n]+)',
        r'(?:^|\n)[\d\.\-\*\+]\s*([^\n]+)',
        r'(?:^|\n)([A-Z][^\n]{10,100})',
    ]
    
    # Pattern to find YouTube links
    youtube_pattern = r'(?:https?://)?(?:www\.)?(?:youtube\.com/watch\?v=|youtu\.be/)([a-zA-Z0-9_-]+)'
    
    # Pattern to find practice links (LeetCode, HackerRank, etc.)
    practice_patterns = [
        r'(?:https?://)?(?:www\.)?leetcode\.com/problems/[^\s]+',
        r'(?:https?://)?(?:www\.)?hackerrank\.com/challenges/[^\s]+',
        r'(?:https?://)?(?:www\.)?codechef\.com/problems/[^\s]+',
        r'(?:https?://)?(?:www\.)?codeforces\.com/problem/[^\s]+',
    ]
    
    # Extract potential tasks
    for pattern in task_patterns:
        matches = re.findall(pattern, text, re.MULTILINE | re.IGNORECASE)
        for match in matches:
            if len(match.strip()) > 5:  # Filter out very short matches
                tasks.append({'name': match.strip()})
    
    # Extract links
    youtube_links = re.findall(youtube_pattern, text)
    practice_links = []
    for pattern in practice_patterns:
        practice_links.extend(re.findall(pattern, text))
    
    # Assign links to tasks (simple heuristic)
    for i, task in enumerate(tasks):
        if i < len(youtube_links):
            task['youtube_link'] = f"https://www.youtube.com/watch?v={youtube_links[i]}"
        if i < len(practice_links):
            task['practice_link'] = practice_links[i]
    
    return tasks[:10]  # Limit to 10 tasks to avoid spam

@app.route('/audio/<filename>')
def uploaded_audio(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/set_active_audio/<int:audio_id>', methods=['POST'])
def set_active_audio(audio_id):
    # Deactivate all audio files
    AudioFile.query.update({'is_active': False})
    
    # Activate the selected audio file
    audio = AudioFile.query.get_or_404(audio_id)
    audio.is_active = True
    
    db.session.commit()
    flash('Audio file activated', 'success')
    return redirect(url_for('index'))

@app.route('/delete_audio/<int:audio_id>', methods=['POST'])
def delete_audio(audio_id):
    audio = AudioFile.query.get_or_404(audio_id)
    
    # Delete the file from filesystem
    if os.path.exists(audio.file_path):
        os.remove(audio.file_path)
    
    db.session.delete(audio)
    db.session.commit()
    
    flash('Audio file deleted', 'success')
    return redirect(url_for('index'))

@app.route('/api/save_working_session', methods=['POST'])
def save_working_session():
    data = request.json
    
    session = WorkingSession(
        date=date.today(),
        start_time=datetime.fromisoformat(data['start_time']),
        end_time=datetime.fromisoformat(data['end_time']) if data.get('end_time') else None,
        duration=data.get('duration', 0),
        session_type=data.get('session_type', 'work')
    )
    
    db.session.add(session)
    
    # Update daily stats
    today = date.today()
    daily_stats = DailyStats.query.filter_by(date=today).first()
    if not daily_stats:
        daily_stats = DailyStats(date=today)
        db.session.add(daily_stats)
    
    daily_stats.working_hours += data.get('duration', 0)
    
    db.session.commit()
    
    return jsonify({'status': 'success'})

@app.route('/api/update_streak', methods=['POST'])
def update_streak():
    data = request.json
    
    today = date.today()
    daily_stats = DailyStats.query.filter_by(date=today).first()
    if not daily_stats:
        daily_stats = DailyStats(date=today)
        db.session.add(daily_stats)
    
    daily_stats.streak_count = data.get('streak_count', 0)
    db.session.commit()
    
    return jsonify({'status': 'success'})

@app.route('/analytics')
def analytics():
    # Get working sessions for the last 7 days
    end_date = date.today()
    start_date = end_date - timedelta(days=30)  # Last 30 days
    
    # Query working sessions and group by date
    sessions = db.session.query(
        WorkingSession.date,
        func.sum(WorkingSession.duration).label('total_duration')
    ).filter(
        WorkingSession.date.between(start_date, end_date)
    ).group_by(
        WorkingSession.date
    ).order_by(
        WorkingSession.date
    ).all()
    
    # Prepare data for the chart
    dates = []
    durations = []
    
    # Fill in all dates in the range, even if no sessions
    current_date = start_date
    while current_date <= end_date:
        dates.append(current_date.strftime('%Y-%m-%d'))
        # Find session for this date, if any
        duration = next((s.total_duration for s in sessions if s.date == current_date), 0)
        # Convert seconds to hours with 2 decimal places
        durations.append(round(duration / 3600, 2))
        current_date += timedelta(days=1)
    
    return render_template('analytics.html', 
                         dates=dates, 
                         durations=durations,
                         title='Working Hours Analytics')

@app.route('/api/save_settings', methods=['POST'])
def save_settings():
    data = request.json
    
    for key, value in data.items():
        setting = Settings.query.filter_by(key=key).first()
        if setting:
            setting.value = str(value)
            setting.updated_at = datetime.utcnow()
        else:
            setting = Settings(key=key, value=str(value))
            db.session.add(setting)
    
    db.session.commit()
    return jsonify({'status': 'success'})
