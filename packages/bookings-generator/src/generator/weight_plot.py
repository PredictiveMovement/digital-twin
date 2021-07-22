import pathlib
import numpy as np
import matplotlib.pyplot as plt

from matplotlib import cm
from matplotlib.ticker import LinearLocator

pathlib.Path("tmp/").mkdir(parents=True, exist_ok=True)


def plot_weights_line(df_address):
    x = df_address.index.to_numpy()
    y = df_address['weight'].to_numpy()

    fig = plt.figure()
    fig.set_size_inches(38, 12)

    plt.step(x, y)
    #plt.plot(x, y, 'o--', color='grey', alpha=0.3)

    plt.grid(axis='x', color='0.95')
    plt.title('Weights')

    filename = 'tmp/weights_line.png'
    plt.savefig(filename, dpi=200)
    print(f"Plotting weights for locations to: {filename}")


def plot_numbers_line(df_time):
    x = df_time.index.to_numpy()
    y = df_time['number'].to_numpy()

    fig = plt.figure()
    fig.set_size_inches(38, 12)

    plt.step(x, y)
    #plt.plot(x, y, 'o--', color='grey', alpha=0.3)

    plt.grid(axis='x', color='0.95')
    plt.title('Numbers')

    filename = 'tmp/numbers_line.png'
    plt.savefig(filename, dpi=200)
    print(f"Plotting distribution of orders over a year to: {filename}")
