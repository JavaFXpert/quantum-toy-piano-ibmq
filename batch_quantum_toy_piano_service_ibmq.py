from qiskit import QuantumCircuit, ClassicalRegister, QuantumRegister, QuantumProgram
from qiskit import available_backends, execute, compile, register, get_backend
from math import *
import numpy as np
from flask import Flask, jsonify, request
import copy
from s04_rotcircuit_ibmq import *
from collections import deque
import time

from qiskit import register

try:
    import Qconfig
    register(Qconfig.APItoken, Qconfig.config["url"])
except:
    print("""WARNING: There's no connection with the API for remote backends.
                 Have you initialized a Qconfig.py file with your personal token?
                 For now, there's only access to local simulator backends...""")

app = Flask(__name__)

DEGREES_OF_FREEDOM = 6
NUM_PITCHES = 4
DIATONIC_SCALE_OCTAVE_PITCHES = 8
NUM_CIRCUIT_WIRES = 3
TOTAL_MELODY_NOTES = 7
CIRCUIT_RESULT_KEY_LENGTH = 5 # '000_m' is such a key, for example

###
# Produces a musical (specifically second-species counterpoint) composition for
# a given initial pitch, and melodic/harmonic rotations degrees. This operates in a degraded mode,
# in that a call to the quantum computer or simulator is made for each note in the resulting
# composition.
#    Parameters:
#        pitch_index Index (0 - 3) of the initial pitch for which a composition is desired. This determines
#                    the mode (Ionian, Dorian, etc.) of the composition
#        species Number (1 - 3) representing the species of counterpoint desired
#        melodic_degrees Comma-delimited string containing 6 rotations in degrees for melody matrix
#        harmonic_degrees Comma-delimited string containing 6 rotations in degrees for harmony matrix
#
#    Returns JSON string containing:
#        melody_part
#            pitch_index
#            start_beat
#            pitch_probs
#        harmony_part
#            pitch_index
#            start_beat
#            pitch_probs
#
#        pitch_index is an integer from (0 - 7) resulting from measurement
#        start_beat is the beat in the entire piece for which the note was produced
#        pitch_probs is an array of eight probabilities from which the pitch_index resulted
###

@app.route('/toy_piano_counterpoint')
def toy_piano_counterpoint():
    pitch_index = int(request.args['pitch_index'])
    if (pitch_index >= NUM_PITCHES):
        pitch_index %= (DIATONIC_SCALE_OCTAVE_PITCHES - 1)

    species = int(request.args['species'])

    melodic_degrees = request.args['melodic_degrees'].split(",")

    harmonic_degrees = request.args['harmonic_degrees'].split(",")

    use_simulator = request.args['use_simulator'].lower() == "true"
    print()
    print("use_simulator: ", use_simulator)

    if (len(melodic_degrees) == DEGREES_OF_FREEDOM and
            len(harmonic_degrees) == DEGREES_OF_FREEDOM and
            1 <= species <= 3 and
            0 <= pitch_index < NUM_PITCHES):

        circuit_dict = {}  # Key is circuit name, value is circuit



        res_dict = dict()
        res_dict['000_m'] = deque([])
        res_dict['000_h'] = deque([])
        res_dict['001_m'] = deque([])
        res_dict['001_h'] = deque([])
        res_dict['010_m'] = deque([])
        res_dict['010_h'] = deque([])
        res_dict['011_m'] = deque([])
        res_dict['011_h'] = deque([])

        q_reg = QuantumRegister(3)
        c_req = ClassicalRegister(3)

        qc_melodic = QuantumCircuit(q_reg, c_req)
        rot_melodic_circuit = compute_circuit(melodic_degrees, q_reg, c_req, qc_melodic)

        qc_harmonic = QuantumCircuit(q_reg, c_req)
        rot_harmonic_circuit = compute_circuit(harmonic_degrees, q_reg, c_req, qc_harmonic)

        # Create all of the potentially required melody circuits
        # TODO: Generalize to handle any number of pitches, and species, and remove hardcoded values
        # Note: 11 melody, 7 harmony is currently a small enough batch for IBMQ devices
        num_required_melodic_circuits_per_pitch = 11 # 6 for first, 16 for second, 27 for third-species
        num_required_harmonic_circuits_per_pitch = 7

        # input_pitch = 0
        for pitch_idx in range(0, NUM_PITCHES):
            for melodic_circuit_idx in range(0, num_required_melodic_circuits_per_pitch):
                input_qc = QuantumCircuit(q_reg, c_req)
                qubit_string = format(pitch_idx, '03b') # TODO: Use NUM_CIRCUIT_WIRES in format string

                # print (qubit_string + ":" + str(melodic_circuit_idx))

                for char_idx in range(NUM_CIRCUIT_WIRES):
                    if qubit_string[char_idx] == '0':
                        input_qc.iden(q_reg[NUM_CIRCUIT_WIRES - 1 - char_idx])
                    else:
                        input_qc.x(q_reg[NUM_CIRCUIT_WIRES - 1 - char_idx])

                input_qc.extend(rot_melodic_circuit)
                circuit_dict[qubit_string + "_m_" + format(melodic_circuit_idx, '02')] = input_qc

                # TODO: Modify console output below to print circuit from circuit_dict
                # print(qp.get_qasm(qubit_string + "_complete_rot_melodic_" + format(melodic_circuit_idx, '02')))

        input_pitch = 0
        for pitch_idx in range(0, NUM_PITCHES):
            for harmonic_circuit_idx in range(0, num_required_harmonic_circuits_per_pitch):
                input_qc = QuantumCircuit(q_reg, c_req)
                qubit_string = format(pitch_idx, '03b') # TODO: Use NUM_CIRCUIT_WIRES in format string

                # print (qubit_string + ":" + str(harmonic_circuit_idx))

                for char_idx in range(NUM_CIRCUIT_WIRES):
                    if qubit_string[char_idx] == '0':
                        input_qc.iden(q_reg[NUM_CIRCUIT_WIRES - 1 - char_idx])
                    else:
                        input_qc.x(q_reg[NUM_CIRCUIT_WIRES - 1 - char_idx])

                input_qc.extend(rot_harmonic_circuit)
                circuit_dict[qubit_string + "_h_" + format(harmonic_circuit_idx, '02')] = input_qc

                # TODO: Modify console output below to print circuit from circuit_dict
                # print(qp.get_qasm(qubit_string + "_complete_rot_harmonic_" + format(harmonic_circuit_idx, '02')))

        # print(circuit_dict)

        if use_simulator:
            quantum_backend = "local_qasm_simulator"
            composer = "IBM Quantum Simulator"
        else:
            quantum_backend = lowest_pending_jobs()
            if quantum_backend == "ibmqx4":
                composer = "IBM Q 5 Tenerife"
            elif quantum_backend == "ibmqx5":
                composer = "IBM Q 16 Rueschlikon"
            else:
                composer = "IBM Quantum Computer"

        print('quantum_backend: ', quantum_backend)

            # quantum_backend = "ibmqx4" # "ibmqx5"
            # composer = "IBM Q 5 Tenerife" # "IBM Q 16 Rueschlikon"

        job = execute(circuit_dict.values(), quantum_backend, shots=1)

        job_result = job.result()

        if use_simulator:
            while not job.done:
                time.sleep(30)

        for circuit_name in circuit_dict.keys():
            # print(circuit_name)
            bitstr = list(job_result.get_counts(circuit_dict[circuit_name]).keys())[0]
            # bitstr = list(sim_result.get_counts(circuit_name).keys())[0]
            res_dict[circuit_name[0:CIRCUIT_RESULT_KEY_LENGTH]].append(bitstr)
            # print(bitstr)

        print(res_dict)

        harmony_notes_factor = 2**(species - 1)  # Number of harmony notes for each melody note
        num_composition_bits = TOTAL_MELODY_NOTES * (harmony_notes_factor + 1) * NUM_CIRCUIT_WIRES

        composition_bits = [0] * num_composition_bits

        # Convert the pitch index to a binary string, and place into the
        # composition_bits array, least significant bits in lowest elements of array
        qubit_string = format(pitch_index, '03b')
        for idx, qubit_char in enumerate(qubit_string):
            if qubit_char == '0':
                composition_bits[idx] = 0
            else:
                composition_bits[idx] = 1

        num_runs = 1

        # Compute notes for the main melody
        for melody_note_idx in range(0, TOTAL_MELODY_NOTES):
            #
            if (melody_note_idx < TOTAL_MELODY_NOTES - 1):
                # Zero the most-significant bit in case is 1 due to a noisy circuit
                res_dict_key = "0"
                for bit_idx in range(1, NUM_CIRCUIT_WIRES):
                    res_dict_key += str(composition_bits[melody_note_idx * NUM_CIRCUIT_WIRES + bit_idx])

                res_dict_key += "_m"

                # Insert a treble-clef C if no more measurements for given note to be popped
                if res_dict[res_dict_key]:
                    bitstr = res_dict[res_dict_key].popleft()
                else:
                    print("Queue " + res_dict_key + " is empty" )
                    bitstr = "111"

                # print("mel res_dict_key bitstr:")
                # print(res_dict_key + "_" + bitstr)

                for bit_idx in range(0, NUM_CIRCUIT_WIRES):
                    composition_bits[(melody_note_idx + 1) * NUM_CIRCUIT_WIRES + bit_idx] = int(bitstr[bit_idx])

                # print(res_dict)

            # Now compute a harmony note for the melody note
            # Zero the most-significant bit in case is 1 due to a noisy circuit
            res_dict_key = "0"
            for bit_idx in range(1, NUM_CIRCUIT_WIRES):
                res_dict_key += str(composition_bits[melody_note_idx * NUM_CIRCUIT_WIRES + bit_idx])

            res_dict_key += "_h"
            bitstr = res_dict[res_dict_key].popleft()

            # print("har res_dict_key bitstr:")
            # print(res_dict_key + "_" + bitstr)

            for bit_idx in range(0, NUM_CIRCUIT_WIRES):
                composition_bits[(melody_note_idx * NUM_CIRCUIT_WIRES * harmony_notes_factor) +
                                 (TOTAL_MELODY_NOTES * NUM_CIRCUIT_WIRES) + bit_idx] = int(bitstr[bit_idx])

            # print(res_dict)

            # Now compute melody notes to follow the harmony note
            for harmony_note_idx in range(1, harmony_notes_factor):

                # Zero the most-significant bit in case is 1 due to a noisy circuit
                res_dict_key = "0"
                for bit_idx in range(1, NUM_CIRCUIT_WIRES):
                    res_dict_key += str(composition_bits[(melody_note_idx * NUM_CIRCUIT_WIRES * harmony_notes_factor) +
                                         ((harmony_note_idx - 1) * NUM_CIRCUIT_WIRES) +
                                         (TOTAL_MELODY_NOTES * NUM_CIRCUIT_WIRES) + bit_idx])

                res_dict_key += "_m"

                # Insert a treble-clef C if no more measurements for given note to be popped
                if res_dict[res_dict_key]:
                    bitstr = res_dict[res_dict_key].popleft()
                else:
                    print("Queue " + res_dict_key + " is empty" )
                    bitstr = "111"

                # print("melb res_dict_key bitstr:")
                # print(res_dict_key + "_" + bitstr)

                for bit_idx in range(0, NUM_CIRCUIT_WIRES):
                    composition_bits[(melody_note_idx * NUM_CIRCUIT_WIRES * harmony_notes_factor) +
                                      ((harmony_note_idx) * NUM_CIRCUIT_WIRES) +
                                     (TOTAL_MELODY_NOTES * NUM_CIRCUIT_WIRES) + bit_idx] = int(bitstr[bit_idx])

        print()
        print(res_dict)

        all_note_nums = create_note_nums_array(composition_bits)
        melody_note_nums = all_note_nums[0:TOTAL_MELODY_NOTES]
        harmony_note_nums = all_note_nums[7:num_composition_bits]

    ret_dict = {"melody": melody_note_nums,
                "harmony": harmony_note_nums,
                "lilypond": create_lilypond(melody_note_nums, harmony_note_nums, composer),
                "toy_piano" : create_toy_piano(melody_note_nums, harmony_note_nums)}

    return jsonify(ret_dict)


def create_note_nums_array(ordered_classical_registers):
    allnotes_array = []
    cur_val = 0
    for idx, bit in enumerate(ordered_classical_registers):
        if idx % 3 == 0:
            cur_val += bit * 4
        elif idx % 3 == 1:
            cur_val += bit * 2
        else:
            cur_val += bit
            allnotes_array.append(cur_val)
            cur_val = 0
    return allnotes_array


def pitch_letter_by_index(pitch_idx):
    retval = "z"
    if pitch_idx == 0:
        retval = "c"
    elif pitch_idx == 1:
        retval = "d"
    elif pitch_idx == 2:
        retval = "e"
    elif pitch_idx == 3:
        retval = "f"
    elif pitch_idx == 4:
        retval = "g"
    elif pitch_idx == 5:
        retval = "a"
    elif pitch_idx == 6:
        retval = "b"
    elif pitch_idx == 7:
        retval = "c'"
    else:
        retval = "z"
    return retval


# Produce output for Lilypond
def create_lilypond(melody_note_nums, harmony_note_nums, composer):
    harmony_notes_fact = int(len(harmony_note_nums) / len(melody_note_nums))
    retval = "\\version \"2.18.2\" \\paper {#(set-paper-size \"a5\")} \\header {title=\"Schrodinger's Cat\" subtitle=\"on a Toy Piano\" composer = \"" + composer + "\"}  melody = \\absolute { \\clef \"bass\" \\numericTimeSignature \\time 4/4 \\tempo 4 = 100"
    for pitch in melody_note_nums:
        retval += " " + pitch_letter_by_index(pitch) + "2"

    # Add the same pitch to the end of the melody as in the beginning
    retval += " " + pitch_letter_by_index(melody_note_nums[0]) + "2"

    retval += "} harmony = \\absolute { \\clef \"treble\" \\numericTimeSignature \\time 4/4 "
    for pitch in harmony_note_nums:
        retval += " " + pitch_letter_by_index(pitch) + "'" + str(int(harmony_notes_fact * 2))

    # Add the same pitch to the end of the harmony as in the beginning of the melody,
    # only an octave higher
    retval += " " + pitch_letter_by_index(melody_note_nums[0]) + "'2"

    retval += "} \\score { << \\new Staff \\with {instrumentName = #\"Harmony\"}  { \\harmony } \\new Staff \\with {instrumentName = #\"Melody\"}  { \\melody } >> }"
    return retval

# Produce output for toy piano
def create_toy_piano(melody_note_nums, harmony_note_nums):
    harmony_notes_fact = int(len(harmony_note_nums) / len(melody_note_nums))
    quarter_note_dur = 150
    notes = []
    latest_melody_idx = 0
    latest_harmony_idx = 0
    num_pitches_in_octave = 7
    toy_piano_pitch_offset = 1

    for idx, pitch in enumerate(melody_note_nums):
        notes.append({"num": pitch + toy_piano_pitch_offset, "time": idx * quarter_note_dur * 2})
        latest_melody_idx = idx

    # Add the same pitch to the end of the melody as in the beginning
    notes.append({"num": melody_note_nums[0] + toy_piano_pitch_offset, "time": (latest_melody_idx + 1) * quarter_note_dur * 2})

    for idx, pitch in enumerate(harmony_note_nums):
        notes.append({"num": pitch + num_pitches_in_octave + toy_piano_pitch_offset, "time": idx * quarter_note_dur * 2 / harmony_notes_fact})
        latest_harmony_idx = idx

    # Add the same pitch to the end of the harmony as in the beginning of the melody,
    # only an octave higher
    notes.append({"num": melody_note_nums[0] + num_pitches_in_octave + toy_piano_pitch_offset, "time": (latest_harmony_idx + 1) * quarter_note_dur * 2 / harmony_notes_fact})

    # Sort the array of dictionaries by time
    sorted_notes = sorted(notes, key=lambda k: k['time'])

    return sorted_notes

def lowest_pending_jobs():
    """Returns the backend with lowest pending jobs."""
    list_of_backends = available_backends(
        {'local': False, 'simulator': False})
    device_status = [get_backend(backend).status
                     for backend in list_of_backends]

    best = min([x for x in device_status if x['available'] is True],
               key=lambda x: x['pending_jobs'])
    return best['name']

if __name__ == '__main__':
    # app.run()
    app.run(host='127.0.0.1', port=5002)
