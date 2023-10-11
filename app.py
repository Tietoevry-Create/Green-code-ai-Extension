import os

import openai
from flask import Flask, redirect, render_template, request, url_for

app = Flask(__name__)
openai.api_key = os.getenv("OPENAI-API-KEY")



def read_files(folder):
    context = ""
    filenames = ""
    for filename in os.listdir(folder):
        f = os.path.join(folder, filename)
        if os.path.isfile(f):
            context += '\n' + open(f, "r").read()
            if filenames != "":
                filenames += ","
            filenames += filename
    f = open("./context.txt", "w").write(filenames)
    f = open("./context.txt", "a").write(context)

def check_for_new_files(folder):
    folder = str(folder)
    f = "./context.txt"
    if not os.path.exists(f):
        read_files(folder)
        return
    filenames = open(f, "r").readline().split(",")
    for filename in os.listdir(folder):
        f = os.path.join(folder, filename)
        if os.path.isfile(f) and not(filenames.__contains__(filename) or filenames.__contains__(filename + '\n')):
            read_files(folder)
            return

check_for_new_files("./activities")

@app.route("/", methods=("GET", "POST"))
def index():
    if request.method == "POST":
        question = request.form["question"]
        response = openai.Completion.create(
            model="gpt-3.5-turbo-instruct",
            prompt=generate_prompt(question),
            temperature=0.6,
            max_tokens=100,
        )
        return redirect(url_for("index", result=response.choices[0].text))

    result = request.args.get("result")
    return render_template("index.html", result=result)

def generate_prompt(question):
    context = open("./context.txt", "r").read()
    return """Fulfill the following request based on the given context:
    "{}"

    {}
    """.format(
        context.capitalize(),
        question.capitalize()
    )