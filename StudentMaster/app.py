from flask import Flask, render_template, request, redirect, url_for
import mysql.connector

app = Flask(__name__)

db_config = {
    'user': 'root',
    'password': 'root',
    'host': 'localhost',
    'database': 'student_database'
}

@app.route('/')
def home():
    return render_template('home.html')

@app.route('/form')
def form():
    return render_template('student_form.html')

@app.route('/submit_student', methods=['POST'])
def submit_student():
    first_name = request.form['first_name']
    middle_name = request.form['middle_name']
    last_name = request.form['last_name']
    contact_no = request.form['contact_no']
    stream = request.form['stream']
    standard = request.form['standard']
    division = request.form['division']
    email_id = request.form['email_id']
    password = request.form['password']

    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()

        query = ("SELECT * FROM students WHERE first_name=%s AND middle_name=%s AND last_name=%s "
                 "AND contact_no=%s AND stream=%s AND standard=%s AND division=%s AND email_id=%s AND password=%s")
        data_check = (first_name, middle_name, last_name, contact_no, stream, standard, division, email_id, password)
        cursor.execute(query, data_check)
        result = cursor.fetchone()

        if result:
            message = "Error: This record already exists in the database."
            return render_template('result.html', message=message)

        add_student = ("INSERT INTO students "
                       "(first_name, middle_name, last_name, contact_no, stream, standard, division, email_id, password) "
                       "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)")
        cursor.execute(add_student, data_check)

        conn.commit()
        cursor.close()
        conn.close()
        message = "Your response has been saved successfully. Thank You!"
        return render_template('result.html', message=message)
    except mysql.connector.Error as err:
        return f"Error: {err}"

@app.route('/view_database')
def view_database():
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        cursor.execute("SELECT first_name, middle_name, last_name, contact_no, stream, standard, division, email_id, password, id FROM students")
        students = cursor.fetchall()
        cursor.close()
        conn.close()
        return render_template('view_database.html', students=students)
    except mysql.connector.Error as err:
        return f"Error: {err}"

@app.route('/edit_student/<int:student_id>', methods=['GET', 'POST'])
def edit_student(student_id):
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()

        if request.method == 'POST':
            first_name = request.form['first_name']
            middle_name = request.form['middle_name']
            last_name = request.form['last_name']
            contact_no = request.form['contact_no']
            stream = request.form['stream']
            standard = request.form['standard']
            division = request.form['division']
            email_id = request.form['email_id']
            password = request.form['password']

            update_query = ("UPDATE students SET first_name=%s, middle_name=%s, last_name=%s, contact_no=%s, stream=%s, standard=%s, division=%s, email_id=%s, password=%s WHERE id=%s")
            update_data = (first_name, middle_name, last_name, contact_no, stream, standard, division, email_id, password, student_id)
            cursor.execute(update_query, update_data)
            conn.commit()

            cursor.close()
            conn.close()
            return redirect(url_for('view_database'))
        else:
            cursor.execute("SELECT first_name, middle_name, last_name, contact_no, stream, standard, division, email_id, password, id FROM students WHERE id=%s", (student_id,))
            student = cursor.fetchone()
            cursor.close()
            conn.close()
            return render_template('edit_student.html', student=student)
    except mysql.connector.Error as err:
        return f"Error: {err}"

@app.route('/delete_student/<int:student_id>')
def delete_student(student_id):
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        delete_query = "DELETE FROM students WHERE id=%s"
        cursor.execute(delete_query, (student_id,))
        conn.commit()

        cursor.close()
        conn.close()
        return redirect(url_for('view_database'))
    except mysql.connector.Error as err:
        return f"Error: {err}"

if __name__ == '__main__':
    app.run(debug=True)
